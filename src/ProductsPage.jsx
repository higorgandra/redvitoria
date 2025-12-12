import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, Archive, Edit, MoreVertical, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, X, CheckCircle, AlertCircle, Megaphone, Trash2, ClipboardPaste, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('active');
  const [brandFilter, setBrandFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBrandPopupOpen, setIsBrandPopupOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProductData, setNewProductData] = useState({ name: '', image: '', brand: 'boticario', category: 'perfumaria', stock: 0, fullPrice: '', discountPercentage: '', price: '', description: '', slug: '' });
  const [editFormData, setEditFormData] = useState({});
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Ref para rastrear o último campo modificado pelo usuário no formulário
  const lastChangedFieldRef = useRef(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const generateSlug = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const fetchProducts = async (isManual = false) => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list = [];
      snap.forEach(d => {
        const data = d.data() || {};
        // Normaliza o status para evitar inconsistências (ex: "arquivado" vs "Arquivado")
        let status = data.status || 'Ativo';
        status = status.charAt(0).toUpperCase() + status.slice(1);

        const priceAsNumber = typeof data.price === 'string' ? parseFloat(String(data.price).replace('R$', '').replace('.', '').replace(',', '.').trim()) : data.price;
        list.push({ id: d.id, ...data, status, price: isNaN(priceAsNumber) ? 0 : priceAsNumber });
      });
      
      // Lógica de Deduplicação Genérica (Corrige duplicatas como "Florata Red")
      const uniqueMap = new Map();
      const duplicatesToRemove = [];

      list.forEach(product => {
        // Chave única baseada no Slug ou Nome (normalizado)
        const key = (product.slug || generateSlug(product.name)).toLowerCase().trim();
        if (!key) return;

        if (uniqueMap.has(key)) {
          const existing = uniqueMap.get(key);
          // Se já existe, decide qual manter (prefere Ativo > Arquivado)
          const isExistingArchived = existing.status === 'Arquivado';
          const isCurrentArchived = product.status === 'Arquivado';
          
          // Se o existente for arquivado e o atual não, substitui pelo atual (mantém o ativo)
          if (isExistingArchived && !isCurrentArchived) {
            duplicatesToRemove.push(existing);
            uniqueMap.set(key, product);
          } else {
            // Caso contrário, mantém o existente e remove o atual (duplicata)
            duplicatesToRemove.push(product);
          }
        } else {
          uniqueMap.set(key, product);
        }
      });

      // Remove duplicatas do banco de dados automaticamente
      if (duplicatesToRemove.length > 0) {
        console.log('[ProductsPage] Removendo duplicatas encontradas:', duplicatesToRemove.length);
        duplicatesToRemove.forEach(async (rem) => {
          try {
            await deleteDoc(doc(db, 'products', String(rem.id)));
          } catch (err) {
            console.error('Erro ao remover duplicata:', rem.id, err);
          }
        });
      }
      
      setProducts(Array.from(uniqueMap.values()));
      if (isManual) {
        setToastMessage({ type: 'success', message: 'Dados sincronizados com sucesso!' });
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setToastMessage({ type: 'error', message: 'Não foi possível carregar os produtos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    lastChangedFieldRef.current = name;
    // Limpa o erro do campo ao ser modificado
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setNewProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    lastChangedFieldRef.current = name;
    // A validação de edição pode ser adicionada aqui de forma similar, se necessário
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Efeito para calcular os campos de preço dinamicamente
  useEffect(() => {
    const calculatePrices = (data, setData) => {
      const fullPrice = parseFloat(String(data.fullPrice).replace(',', '.')) || 0;
      const discount = parseFloat(String(data.discountPercentage).replace(',', '.')) || 0;
      const price = parseFloat(String(data.price).replace(',', '.')) || 0;

      let updatedValues = {};

      if (lastChangedFieldRef.current === 'fullPrice' || lastChangedFieldRef.current === 'discountPercentage') {
        if (fullPrice > 0) {
          const newPrice = fullPrice * (1 - discount / 100);
          if (newPrice.toFixed(2) !== price.toFixed(2)) {
            updatedValues.price = newPrice.toFixed(2);
          }
        }
      } else if (lastChangedFieldRef.current === 'price') {
        if (fullPrice > 0 && price > 0 && fullPrice > price) {
          const newDiscount = ((fullPrice - price) / fullPrice) * 100;
          if (Math.round(newDiscount) !== Math.round(discount)) {
            updatedValues.discountPercentage = Math.round(newDiscount);
          }
        } else if (price >= fullPrice) {
          // Se o preço final for maior ou igual ao cheio, o desconto é 0
          if (discount !== 0) {
            updatedValues.discountPercentage = 0;
          }
        }
      }

      if (Object.keys(updatedValues).length > 0) {
        setData(prevData => ({
          ...prevData,
          ...updatedValues
        }));
      }
    };

    // Aplica a lógica para o formulário de edição
    if (editingProduct) {
      calculatePrices(editFormData, setEditFormData);
    }
    // Aplica a lógica para o formulário de novo produto
    else if (isAddModalOpen) {
      calculatePrices(newProductData, setNewProductData);
    }

  }, [
    isAddModalOpen, newProductData.fullPrice, newProductData.discountPercentage, newProductData.price,
    editingProduct, editFormData.fullPrice, editFormData.discountPercentage, editFormData.price
  ]);



  const handlePasteFromClipboard = async (formType) => {
    try {
      const text = await navigator.clipboard.readText();
      if (formType === 'new') setNewProductData(prev => ({ ...prev, image: text })); else setEditFormData(prev => ({ ...prev, image: text }));
      setToastMessage({ type: 'success', message: 'Link colado da área de transferência!' });
    } catch (err) {
      console.error('Falha ao colar da área de transferência:', err);
      setToastMessage({ type: 'error', message: 'Não foi possível ler a área de transferência.' });
    }
  };

  const handleAddNewProduct = async () => {
    setFormErrors({}); // Limpa erros anteriores
    const errors = {};
    const isAd = newProductData.brand === 'anuncio';

    // Validações
    if (!newProductData.name.trim()) errors.name = 'O nome do produto é obrigatório.';

    if (isAd) {
      if (!newProductData.link?.trim()) errors.link = 'O link do anúncio é obrigatório.';
    } else {
      if (!newProductData.image.trim()) errors.image = 'O link da imagem é obrigatório.';
      if (!newProductData.fullPrice || parseFloat(String(newProductData.fullPrice).replace(',', '.')) <= 0) errors.fullPrice = 'O "Valor Cheio" é obrigatório.';
      if (newProductData.discountPercentage === '' || isNaN(parseFloat(String(newProductData.discountPercentage).replace(',', '.')))) errors.discountPercentage = 'O "Desconto" é obrigatório.';
      if (!newProductData.price || parseFloat(String(newProductData.price).replace(',', '.')) <= 0) errors.price = 'O "Preço Final" é obrigatório.';
      if (parseInt(newProductData.stock, 10) <= 0) errors.stock = 'O estoque deve ser maior que zero.';
    }

    if (newProductData.slug && /[^a-z0-9\-]/.test(newProductData.slug.toLowerCase())) {
      errors.slug = 'O Slug deve conter apenas letras, números e hífens (sem espaços ou caracteres especiais).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setToastMessage({ type: 'error', message: 'Por favor, preencha os campos obrigatórios.' });
      return;
    }

    const adExists = products.some(p => p.status === 'Anúncio');
    if (isAd && adExists) {
      setToastMessage({ type: 'error', message: 'Apenas um anúncio é permitido. Arquive o existente para criar um novo.' });
      return;
    }

    setIsSaving(true);
    try {
      // Limpa os erros e o formulário ao submeter com sucesso
      setFormErrors({});
      const brandPrefix = (newProductData.brand || '').substring(0, 3).toUpperCase();
      const uniqueNumber = Date.now().toString().slice(-4);
      const generatedSku = `${brandPrefix}-${uniqueNumber}`;
      const stock = parseInt(newProductData.stock, 10);
      const slug = newProductData.slug ? generateSlug(newProductData.slug) : generateSlug(newProductData.name);
      
      if (slug) {
        const q = query(collection(db, 'products'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        const docRef = doc(db, 'products', slug);
        const docSnap = await getDoc(docRef);

        if (!querySnapshot.empty || docSnap.exists()) {
          setToastMessage({ type: 'error', message: 'Este Slug já está em uso. Por favor, altere o nome ou o slug.' });
          setIsSaving(false);
          return;
        }
      }

      let finalId = String(slug || Date.now());
      const status = isAd ? 'Anúncio' : ((isNaN(stock) || stock === 0) ? 'Sem Estoque' : 'Ativo');
      const dataToSave = { ...newProductData, price: isAd ? 0 : parseFloat(newProductData.price), fullPrice: isAd ? 0 : parseFloat(newProductData.fullPrice), stock: isAd ? 0 : (isNaN(stock) ? 0 : stock), slug, sku: generatedSku, discountPercentage: isAd ? 0 : (parseFloat(newProductData.discountPercentage) || 0), description: newProductData.description || '', status: status, link: isAd ? (newProductData.link || '') : `https://redvitoria.pages.dev/produto/${finalId}`, createdAt: serverTimestamp() };
      await setDoc(doc(db, 'products', finalId), dataToSave);
      console.log('[ProductsPage] added product id=', String(finalId), 'slug=', slug);
      setProducts(prev => [{ id: finalId, ...dataToSave }, ...prev]);
      setIsAddModalOpen(false);
      setNewProductData({ name: '', image: '', brand: 'boticario', category: 'perfumaria', stock: 0, fullPrice: '', discountPercentage: '', price: '', description: '', slug: '' });
      setToastMessage({ type: 'success', message: 'Produto criado com sucesso!' });
    } catch (err) {
      console.error('Erro ao adicionar anúncio:', err);
      setToastMessage({ type: 'error', message: 'Não foi possível criar o anúncio.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveProduct = async (productId) => {
    if (!productId) return;
    try {
      const docRef = doc(db, 'products', String(productId));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setToastMessage({ type: 'error', message: 'Produto não encontrado.' });
        return;
      }
      await setDoc(docRef, { status: 'Arquivado' }, { merge: true });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'Arquivado' } : p));
      setArchiveConfirmId(null);
      setToastMessage({ type: 'success', message: 'Produto arquivado com sucesso!' });
    } catch (err) {
      console.error('Erro ao arquivar produto:', err, 'ID:', productId);
      setToastMessage({ type: 'error', message: 'Não foi possível arquivar o produto.' });
    }
  };

  const handleRestoreProduct = async (productId) => {
    if (!productId) return;
    try {
      const docRef = doc(db, 'products', String(productId));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setToastMessage({ type: 'error', message: 'Produto não encontrado.' });
        return;
      }
      await setDoc(docRef, { status: 'Ativo' }, { merge: true });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'Ativo' } : p));
      setToastMessage({ type: 'success', message: 'Produto restaurado com sucesso!' });
    } catch (err) {
      console.error('Erro ao restaurar produto:', err, 'ID:', productId);
      setToastMessage({ type: 'error', message: 'Não foi possível restaurar o produto.' });
    }
  };

  const handleDeleteClick = (productId) => { setDeleteConfirmId(productId); setActiveDropdownId(null); };
  const handleDeleteProduct = async () => { if (!deleteConfirmId) return; try { await deleteDoc(doc(db, 'products', String(deleteConfirmId))); setProducts(prev => prev.filter(p => p.id !== deleteConfirmId)); setDeleteConfirmId(null); setToastMessage({ type: 'success', message: 'Produto excluído permanentemente.' }); } catch (err) { console.error('Erro ao excluir produto:', err); setToastMessage({ type: 'error', message: 'Não foi possível excluir o produto.' }); } };

  // Immediate delete helper (used by the UI delete button)
  const handleDeleteNow = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', String(productId)));
      setProducts(prev => prev.filter(p => p.id !== productId));
      setToastMessage({ type: 'success', message: 'Produto excluído permanentemente.' });
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      setToastMessage({ type: 'error', message: 'Não foi possível excluir o produto.' });
    }
  };

  const handleDropdownToggle = (e, productId) => { e.stopPropagation(); setActiveDropdownId(prev => (prev === productId ? null : productId)); };

  const handleEditClick = (product) => {
    lastChangedFieldRef.current = null; // Reseta o rastreamento para evitar recálculos automáticos indesejados ao abrir
    setEditingProduct(product);
    // Correção: Se não houver fullPrice, assume o preço atual (sem desconto) em vez de dobrar o valor
    const fullPrice = product.fullPrice || product.price || 0;
    const price = product.price || 0;
    let discountPercentage = 0;
    if (fullPrice > 0 && price > 0 && fullPrice > price) discountPercentage = ((fullPrice - price) / fullPrice) * 100;
    setEditFormData({ ...product, fullPrice, description: product.description || '', slug: product.slug || '', link: product.link || '', category: product.category || 'perfumaria', discountPercentage: discountPercentage > 0 ? discountPercentage.toFixed(0) : '' });
  };

  const handleUpdateProduct = async (publish = true) => {
    if (!editingProduct) return;
    const productId = String(editingProduct.id);
    const stock = parseInt(editFormData.stock, 10);
    let status = editFormData.status;

    if (editFormData.slug && /[^a-z0-9\-]/.test(editFormData.slug.toLowerCase())) {
      setToastMessage({ type: 'error', message: 'O Slug deve conter apenas letras, números e hífens.' });
      return;
    }

    if (status !== 'Anúncio' && (isNaN(stock) || stock < 0)) {
      setToastMessage({ type: 'error', message: 'O estoque não pode ser negativo.' });
      return;
    }

    if (status !== 'Anúncio') {
      // Se o produto já estiver Arquivado, mantém o status para evitar ativação acidental ao editar
      if (status === 'Arquivado') {
        // Mantém 'Arquivado'
      } else {
        // Recalcula status baseado no estoque apenas se não estiver arquivado
        status = stock > 0 ? 'Ativo' : 'Sem Estoque';
      }
    }
    const newSlug = editFormData.slug ? generateSlug(editFormData.slug) : generateSlug(editFormData.name);
    
    // Verifica duplicidade de Slug na edição
    if (newSlug && newSlug !== editingProduct.slug) {
      setIsSaving(true);
      const q = query(collection(db, 'products'), where('slug', '==', newSlug));
      const querySnapshot = await getDocs(q);
      const duplicateSlug = querySnapshot.docs.some(d => d.id !== productId);
      
      const docRef = doc(db, 'products', newSlug);
      const docSnap = await getDoc(docRef);
      const duplicateId = docSnap.exists() && docSnap.id !== productId;

      if (duplicateSlug || duplicateId) {
        setToastMessage({ type: 'error', message: 'Este Slug já está em uso por outro produto.' });
        setIsSaving(false);
        return;
      }
    }

    const price = parseFloat(String(editFormData.price).replace(',', '.'));
    const fullPrice = parseFloat(String(editFormData.fullPrice).replace(',', '.'));
    const discountPercentage = parseFloat(String(editFormData.discountPercentage).replace(',', '.')) || 0;

    if (status !== 'Anúncio' && (isNaN(price) || isNaN(fullPrice))) {
      setToastMessage({ type: 'error', message: 'Por favor, verifique os valores de preço.' });
      return;
    }

    const updatedData = { 
      ...editFormData, 
      price: isNaN(price) ? 0 : price, 
      fullPrice: isNaN(fullPrice) ? 0 : fullPrice, 
      stock: isNaN(stock) ? 0 : stock, 
      slug: newSlug, 
      discountPercentage, 
      link: status === 'Anúncio' ? (editFormData.link || '') : `https://redvitoria.pages.dev/produto/${newSlug}`, 
      description: editFormData.description || '', 
      status,
      updatedAt: serverTimestamp()
    };

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'products', productId), updatedData);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedData } : p));
      setEditingProduct(null);
      setToastMessage({ type: 'success', message: 'Produto atualizado com sucesso!' });
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setToastMessage({ type: 'error', message: 'Não foi possível atualizar o produto.' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(product => {
    // Lógica de visualização: 'ativos' mostra tudo que não está arquivado (incluindo o anúncio). 'arquivados' mostra apenas os arquivados.
    const matchesView = view === 'active' ? product.status !== 'Arquivado' : product.status === 'Arquivado';
    if (!matchesView) return false;
    const matchesBrand = brandFilter === 'all' || product.brand === brandFilter;
    if (!matchesBrand) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (product.name || '').toLowerCase().includes(q);
    const skuMatch = (product.sku || '').toLowerCase().includes(q);
    return nameMatch || skuMatch;
  });

  const [productsPerPage, setProductsPerPage] = useState(() => (typeof window !== 'undefined' && window.innerWidth >= 768) ? 10 : 6);
  useEffect(() => { const handleResize = () => setProductsPerPage(window.innerWidth >= 768 ? 10 : 6); handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages]);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const handlePageChange = (newPage) => { if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage); };

  // Verifica se já existe um produto com o status 'Anúncio'
  const adExists = products.some(p => p.status === 'Anúncio');

  const brands = [
    { value: 'all', label: 'Todas' },
    { value: 'natura', label: 'Natura' },
    { value: 'boticario', label: 'Boticário' },
    { value: 'avon', label: 'Avon' },
    { value: 'eudora', label: 'Eudora' },
    { value: 'quem-disse-berenice', label: 'Quem disse, Berenice?' },
    { value: 'loccitane-au-bresil', label: "L'occitane Au Brésil" }, { value: 'oui-paris', label: 'O.U.i Paris' },
    { value: 'anuncio', label: 'Anúncio (Card Especial)' }
  ];

  const categories = [
    { value: 'promocoes', label: 'Promoções' },
    { value: 'presentes', label: 'Presentes' },
    { value: 'perfumaria', label: 'Perfumaria' },
    { value: 'corpo-e-banho', label: 'Corpo e Banho' },
    { value: 'cabelos', label: 'Cabelos' },
    { value: 'maquiagem', label: 'Maquiagem' },
    { value: 'rosto', label: 'Rosto' },
    { value: 'casa', label: 'Casa' },
    { value: 'infantil', label: 'Infantil' },
    { value: 'homens', label: 'Homens' },
    { value: 'acessorios', label: 'Acessórios' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-2">
          <button onClick={() => fetchProducts(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-colors" title="Sincronizar dados">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          <button onClick={() => { lastChangedFieldRef.current = null; setIsAddModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] text-white rounded-lg font-semibold shadow-sm hover:bg-[#650000] transition-colors"><PlusCircle size={16} /> Novo Produto</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setView('active'); setCurrentPage(1); }} className={`px-4 py-2 rounded ${view === 'active' ? 'bg-[#8B0000] text-white' : 'bg-gray-100'}`}>Ativos</button>
        <button onClick={() => { setView('archived'); setCurrentPage(1); }} className={`px-4 py-2 rounded ${view === 'archived' ? 'bg-[#8B0000] text-white' : 'bg-gray-100'}`}>Arquivados</button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-3 py-2 border rounded" placeholder="Buscar por nome ou SKU" />
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
            <tr>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3">Marca</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Estoque</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-600">Carregando produtos...</td></tr>
            )}
            {!loading && currentProducts.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-600">Nenhum produto encontrado.</td></tr>
            )}
            {!loading && currentProducts.map(product => (
              <tr key={product.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{product.name || <span className="text-red-400 italic">Sem nome</span>}</div>
                      <div className="text-xs text-gray-500">{product.sku || '-'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 capitalize">{product.brand}</td>
                <td className="p-3">R$ {Number(product.price || 0).toFixed(2)}</td>
                <td className="p-3">{product.stock ?? 0}</td>
                <td className="p-3">{product.status}</td>
                <td className="p-3">
                  <div className="flex gap-2 justify-end">
                    {view === 'archived' || product.status === 'Arquivado' ? (
                      <>
                        <button onClick={() => handleRestoreProduct(product.id)} className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded border"><CheckCircle size={16} /> Restaurar</button>
                        <button onClick={() => handleDeleteClick(product.id)} className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded border"><Trash2 size={16} /> Excluir</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(product)} className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded border"><Edit size={16} /> Editar</button>
                        <button onClick={() => { setArchiveConfirmId(product.id); }} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded border"><Archive size={16} /> Arquivar</button>
                        <button onClick={() => handleDeleteClick(product.id)} className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded border"><Trash2 size={16} /> Excluir</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Mostrando {filteredProducts.length === 0 ? 0 : indexOfFirstProduct + 1} - {Math.min(indexOfLastProduct, filteredProducts.length)} de {filteredProducts.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded">Anterior</button>
          <span className="text-sm">{currentPage} / {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded">Próxima</button>
        </div>
      </div>
      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white rounded-lg shadow-lg z-10 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja excluir este produto? Esta ação é permanente.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={handleDeleteProduct} className="px-4 py-2 bg-red-600 text-white rounded">Excluir</button>
            </div>
          </div>
        </div>
      )}
      {/* Archive confirmation modal */}
      {archiveConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setArchiveConfirmId(null)} />
          <div className="bg-white rounded-lg shadow-lg z-10 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar arquivamento</h3>
            <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja arquivar este produto? Ele ficará oculto na loja mas poderá ser restaurado.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setArchiveConfirmId(null)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={() => handleArchiveProduct(archiveConfirmId)} className="px-4 py-2 bg-yellow-500 text-white rounded">Sim, arquivar</button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); setFormErrors({}); }} />
          <div className="bg-white rounded-lg shadow-lg z-10 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {(() => {
                const isAdForm = (editingProduct ? editFormData.brand : newProductData.brand) === 'anuncio';
                const currentData = editingProduct ? editFormData : newProductData;
                const slugPreview = generateSlug(currentData.slug || currentData.name);
                const finalLinkPreview = isAdForm ? (currentData.link || 'N/A') : `https://redvitoria.pages.dev/produto/${slugPreview}`;

                return <>
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <label className="block text-sm font-medium mb-1">Nome do Produto</label>
                      <input type="text" name="name" value={editingProduct ? editFormData.name : newProductData.name} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className={`w-full p-2 border rounded ${formErrors.name ? 'border-red-500' : ''}`} />
                      {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium mb-1">Marca</label>
                      <select name="brand" value={editingProduct ? editFormData.brand : newProductData.brand} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className="w-full p-2 border rounded bg-white">
                        {brands.filter(b => b.value !== 'all').map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium mb-1">Categoria</label>
                      <select name="category" value={editingProduct ? editFormData.category : newProductData.category} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className="w-full p-2 border rounded bg-white">
                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{isAdForm ? 'Link do Anúncio' : 'Link da Imagem'}</label>
                    <div className="flex gap-2">
                      <input type="text" name={isAdForm ? 'link' : 'image'} value={editingProduct ? (isAdForm ? editFormData.link : editFormData.image) : (isAdForm ? newProductData.link : newProductData.image)} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className={`w-full p-2 border rounded ${formErrors.image || formErrors.link ? 'border-red-500' : ''}`} />
                      {!isAdForm && <button onClick={() => handlePasteFromClipboard(editingProduct ? 'edit' : 'new')} className="p-2 border rounded" title="Colar da área de transferência"><ClipboardPaste size={16} /></button>}
                    </div>
                    {(formErrors.image || formErrors.link) && <p className="text-xs text-red-600 mt-1">{formErrors.image || formErrors.link}</p>}
                    {/* Image Preview */}
                    {!isAdForm && (editingProduct ? editFormData.image : newProductData.image) && (
                      <div className="mt-2">
                        <img 
                          src={editingProduct ? editFormData.image : newProductData.image} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded border bg-gray-50" 
                          onError={(e) => e.target.style.display = 'none'} 
                        />
                      </div>
                    )}
                  </div>
                  {!isAdForm && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Valor Cheio (R$)</label>
                          <input type="number" name="fullPrice" value={editingProduct ? editFormData.fullPrice : newProductData.fullPrice} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className={`w-full p-2 border rounded ${formErrors.fullPrice ? 'border-red-500' : ''}`} placeholder="Ex: 129.90" />
                          {formErrors.fullPrice && <p className="text-xs text-red-600 mt-1">{formErrors.fullPrice}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Desconto (%)</label>
                          <input type="number" name="discountPercentage" value={editingProduct ? editFormData.discountPercentage : newProductData.discountPercentage} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className={`w-full p-2 border rounded ${formErrors.discountPercentage ? 'border-red-500' : ''}`} placeholder="Ex: 20" />
                          {formErrors.discountPercentage && <p className="text-xs text-red-600 mt-1">{formErrors.discountPercentage}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Preço Final (R$)</label>
                          <input type="number" name="price" value={editingProduct ? editFormData.price : newProductData.price} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className={`w-full p-2 border rounded ${formErrors.price ? 'border-red-500' : ''}`} placeholder="Ex: 103.92" />
                          {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Estoque</label>
                          <input type="number" name="stock" value={editingProduct ? editFormData.stock : newProductData.stock} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className={`w-full p-2 border rounded ${formErrors.stock ? 'border-red-500' : ''}`} />
                          {formErrors.stock && <p className="text-xs text-red-600 mt-1">{formErrors.stock}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <textarea name="description" value={editingProduct ? editFormData.description : newProductData.description} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className="w-full p-2 border rounded" rows="3"></textarea>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug (URL amigável)</label>
                    <input type="text" name="slug" value={editingProduct ? editFormData.slug : newProductData.slug} onChange={editingProduct ? handleEditFormChange : handleNewProductChange} className={`w-full p-2 border rounded ${formErrors.slug ? 'border-red-500' : ''}`} placeholder="Deixe em branco para gerar do nome" />
                    {formErrors.slug && <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>}
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Link Final:</p>
                      <p className="text-xs text-blue-600 bg-gray-50 p-2 rounded break-all">
                        {finalLinkPreview}
                      </p>
                    </div>
                  </div>
                </>;
              })()}
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); setFormErrors({}); }} className="px-4 py-2 border rounded" disabled={isSaving}>Cancelar</button>
              <button onClick={editingProduct ? () => handleUpdateProduct() : handleAddNewProduct} className="px-4 py-2 bg-[#8B0000] text-white rounded flex items-center gap-2" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (editingProduct ? 'Salvar Alterações' : 'Adicionar Produto')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transition-all transform duration-300 z-50 ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{toastMessage.message}</span>
            <button onClick={() => setToastMessage(null)} className="ml-4 hover:opacity-80"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
