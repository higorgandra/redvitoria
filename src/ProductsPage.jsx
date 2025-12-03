import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Archive, Edit, MoreVertical, RotateCw, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, X, Percent, CheckCircle, AlertCircle, Megaphone, Trash2 } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

const formatPrice = (price) => {
    // Garante que o preço seja um número, mesmo que venha como string "R$ 199,90"
    const numericPrice = typeof price === 'string'
        ? parseFloat(price.replace('R$', '').replace('.', '').replace(',', '.').trim())
        : price;

    if (isNaN(numericPrice)) return 'R$ --'; // Retorna um placeholder se a conversão falhar

    return numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ProductRow = ({ product, view, onArchiveClick, onRestore, onEditClick, onDeleteClick, onDropdownToggle, activeDropdownId }) => {
    const getStatusClass = (status) => {
        switch (status) {
            case 'Ativo': return 'bg-green-100 text-green-800';
            case 'Arquivado': return 'bg-gray-100 text-gray-800';
            case 'Anúncio': return 'bg-blue-100 text-blue-800';
            case 'Sem Estoque': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Determina o status real com base no estoque, exceto para 'Anúncio' e 'Arquivado'.
    const getEffectiveStatus = (product) => {
        if (product.status === 'Anúncio' || product.status === 'Arquivado') {
            return product.status;
        }
        return product.stock > 0 ? 'Ativo' : 'Sem Estoque';
    };

    const effectiveStatus = getEffectiveStatus(product);

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="p-4">
                <div className="flex items-center gap-4">
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-contain rounded-md bg-gray-100" />
                    <div>
                        <p className="font-semibold text-gray-800 line-clamp-2">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku || 'N/A'}</p>
                    </div>
                </div>
            </td>
            <td className="p-4 text-gray-600 capitalize">
                {product.status === 'Anúncio' ? 'Anúncio' : product.brand}
            </td>
            <td className="p-4 text-gray-600">
                {product.status === 'Anúncio' ? '—' : formatPrice(product.price)}
            </td>
            <td className="p-4 font-medium text-gray-800">
                {product.status === 'Anúncio' ? 'AD' : product.stock}
            </td>
            <td className="p-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(effectiveStatus)}`}>
                    {effectiveStatus}
                </span>
            </td>
            <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                    <button 
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-md hover:bg-gray-100"
                        onClick={() => onEditClick(product)}
                    >
                        <Edit size={16} />
                    </button>
                    {view === 'active' ? (
                        <button 
                            title="Arquivar" 
                            className="text-gray-500 hover:text-red-600 p-2 rounded-md hover:bg-gray-100"
                            onClick={() => onArchiveClick(product.id)}
                        >
                            <Archive size={16} />
                        </button>
                    ) : (
                        <button 
                            title="Restaurar" 
                            className="text-gray-500 hover:text-green-600 p-2 rounded-md hover:bg-gray-100"
                            onClick={() => onRestore(product.id)}
                        >
                            <RotateCw size={16} />
                        </button>
                    )}
                    <div className="relative">
                        <button 
                            onClick={(e) => onDropdownToggle(e, product.id)}
                            className="text-gray-500 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100"
                        >
                            <MoreVertical size={16} />
                        </button>
                        {activeDropdownId === product.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-10 border border-gray-100">
                                <button 
                                    onClick={() => onDeleteClick(product.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 size={16} /> Excluir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
};

const initialProductState = {
    name: '',
    brand: 'natura', // Valor padrão
    price: 0,
    fullPrice: 0,
    stock: 1,
    image: '',
    sku: '',
    status: 'Ativo',
    discountPercentage: '',
};

const ProductsPage = () => {
    const [view, setView] = useState('active'); // 'active' ou 'archived'
    const [searchQuery, setSearchQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isBrandPopupOpen, setIsBrandPopupOpen] = useState(false);
    const [archiveConfirmId, setArchiveConfirmId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Estado para o modal de adição
    const [editingProduct, setEditingProduct] = useState(null); // Produto sendo editado
    const [editFormData, setEditFormData] = useState({}); // Dados do formulário de edição
    const [newProductData, setNewProductData] = useState(initialProductState); // Estado para o novo produto
    const [toastMessage, setToastMessage] = useState(null); // { type: 'success' | 'error', message: string }
    const [activeDropdownId, setActiveDropdownId] = useState(null); // Controla qual dropdown de ações está aberto
    const [deleteConfirmId, setDeleteConfirmId] = useState(null); // Controla o modal de exclusão

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const productsList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Converte o preço para número durante a busca de dados
                    const priceAsNumber = typeof data.price === 'string'
                        ? parseFloat(data.price.replace('R$', '').replace('.', '').replace(',', '.').trim())
                        : data.price;
                    return { id: doc.id, ...data, price: isNaN(priceAsNumber) ? 0 : priceAsNumber };
                });
                setProducts(productsList);
            } catch (error) {
                console.error("Erro ao buscar produtos do Firestore: ", error);
            }
            setLoading(false);
        };

        fetchProducts();
    }, []);

    // Efeito para fechar o dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdownId(null);
        if (activeDropdownId) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeDropdownId]);

    // Reseta para a primeira página sempre que um filtro for alterado
    useEffect(() => {
        setCurrentPage(1);
    }, [view, searchQuery, brandFilter]);

    // Efeito para limpar a mensagem do toast após alguns segundos
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 4000); // A mensagem desaparece após 4 segundos

            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleArchiveProduct = async (productId) => {
        const productRef = doc(db, "products", String(productId));
        try {
            await updateDoc(productRef, {
                status: "Arquivado"
            });
            // Atualiza o estado local para refletir a mudança na UI instantaneamente
            setProducts(products.map(p => 
                p.id === productId ? { ...p, status: 'Arquivado' } : p
            ));
            setArchiveConfirmId(null); // Fecha o popup após arquivar
        } catch (error) {
            console.error("Erro ao arquivar produto: ", error);
            setToastMessage({ type: 'error', message: 'Não foi possível arquivar o produto.' });
        }
    };

    const handleRestoreProduct = async (productId) => {
        const productRef = doc(db, "products", String(productId));
        try {
            await updateDoc(productRef, {
                status: "Ativo"
            });
            // Atualiza o estado local para refletir a mudança na UI instantaneamente
            setProducts(products.map(p => 
                p.id === productId ? { ...p, status: 'Ativo' } : p
            ));
        } catch (error) {
            console.error("Erro ao restaurar produto: ", error);
            setToastMessage({ type: 'error', message: 'Não foi possível restaurar o produto.' });
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);





















































































        const fullPrice = product.fullPrice || product.price * 2; // Assume um valor cheio se não existir
        const price = product.price;
        let discountPercentage = 0;

        if (fullPrice > 0 && price > 0 && fullPrice > price) {
            discountPercentage = ((fullPrice - price) / fullPrice) * 100;
        }

        setEditFormData({
            ...product,
            fullPrice: fullPrice,
            link: product.link || '', // Adiciona o campo link
            discountPercentage: discountPercentage > 0 ? discountPercentage.toFixed(0) : '',
        });
    };

    const handleAddProductClick = () => {
        setNewProductData(initialProductState); // Reseta o formulário para o estado inicial
        setIsAddModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...editFormData, [name]: value };

        const fullPrice = parseFloat(newFormData.fullPrice);
        const price = parseFloat(newFormData.price);
        const discountPercentage = parseFloat(newFormData.discountPercentage);

        if (name === 'discountPercentage') {
            if (!isNaN(discountPercentage) && !isNaN(fullPrice) && fullPrice > 0) {
                const newPrice = fullPrice * (1 - discountPercentage / 100);
                newFormData.price = newPrice.toFixed(2);
            }
        } else if (name === 'fullPrice' || name === 'price') {
            if (!isNaN(fullPrice) && !isNaN(price) && fullPrice > price) {
                const newDiscount = ((fullPrice - price) / fullPrice) * 100;
                newFormData.discountPercentage = newDiscount.toFixed(0);
            } else {
                newFormData.discountPercentage = '';
            }
        }

        setEditFormData(newFormData);
    };

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...newProductData, [name]: value };

        const fullPrice = parseFloat(newFormData.fullPrice);
        const price = parseFloat(newFormData.price);
        const discountPercentage = parseFloat(newFormData.discountPercentage);

        if (name === 'discountPercentage') {
            if (!isNaN(discountPercentage) && !isNaN(fullPrice) && fullPrice > 0) {
                const newPrice = fullPrice * (1 - discountPercentage / 100);
                newFormData.price = newPrice.toFixed(2);
            }
        } else if (name === 'fullPrice' || name === 'price') {
            if (!isNaN(fullPrice) && !isNaN(price) && fullPrice > price) {
                const newDiscount = ((fullPrice - price) / fullPrice) * 100;
                newFormData.discountPercentage = newDiscount.toFixed(0);
            } else {
                newFormData.discountPercentage = '';
            }
        }

        setNewProductData(newFormData);
    };

    const calculateDiscount = (fullPrice, price) => {
        if (fullPrice > 0 && price > 0 && fullPrice > price) {
            return (((fullPrice - price) / fullPrice) * 100).toFixed(0);
        }
        return null;
    };

    const handleUpdateProduct = async (publish = true) => {
        if (!editingProduct) return;

        const productRef = doc(db, "products", String(editingProduct.id));
        
        const stock = parseInt(editFormData.stock, 10);
        let status = editFormData.status;

        // Lógica de status automático, mas preserva o status 'Anúncio'
        if (status !== 'Anúncio') {
            if (publish) {
                // Se está publicando (vindo da aba 'Arquivados'), o status deve mudar.
                status = stock > 0 ? 'Ativo' : 'Sem Estoque';
            } else if (stock === 0 && status !== 'Arquivado') {
                // Se está apenas salvando (na aba 'Ativos') e o estoque zerou.
                status = 'Sem Estoque';
            }
        }

        const updatedData = {
            ...editFormData,
            price: parseFloat(editFormData.price),
            fullPrice: parseFloat(editFormData.fullPrice),
            stock: stock,
            discountPercentage: parseFloat(editFormData.discountPercentage) || 0,
            link: editFormData.link || '',
            status: status,
        };

        try {
            await updateDoc(productRef, updatedData);
            // Atualiza o estado local
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...updatedData } : p));
            setEditingProduct(null); // Fecha o modal
            setToastMessage({ type: 'success', message: 'Produto atualizado com sucesso!' });
        } catch (error) {
            console.error("Erro ao atualizar produto: ", error);
            setToastMessage({ type: 'error', message: 'Não foi possível atualizar o produto.' });
        }
    };

    const handleAddNewProduct = async () => {
        // Validação dos campos obrigatórios
        if (!newProductData.name.trim()) {
            setToastMessage({ type: 'error', message: 'O nome do produto é obrigatório.' });
            return;
        }
        if (!newProductData.image.trim()) {
            setToastMessage({ type: 'error', message: 'O link da imagem é obrigatório.' });
            return;
        }
        if (!newProductData.fullPrice || parseFloat(newProductData.fullPrice) <= 0) {
            setToastMessage({ type: 'error', message: 'O "Valor Cheio" é obrigatório e deve ser maior que zero.' });
            return;
        }
        if (newProductData.discountPercentage === '' || isNaN(parseFloat(newProductData.discountPercentage))) {
            setToastMessage({ type: 'error', message: 'O campo "Desconto" é obrigatório (pode ser 0).' });
            return;
        }
        if (!newProductData.price || parseFloat(newProductData.price) <= 0) {
            setToastMessage({ type: 'error', message: 'O "Preço Final" é obrigatório e deve ser maior que zero.' });
            return;
        }

        try {
            // --- GERAÇÃO AUTOMÁTICA DO SKU ---
            // Pega as 3 primeiras letras da marca, em maiúsculas.
            const brandPrefix = newProductData.brand.substring(0, 3).toUpperCase();
            // Pega os últimos 4 dígitos do timestamp atual para criar um número aleatório.
            const uniqueNumber = Date.now().toString().slice(-4);
            const generatedSku = `${brandPrefix}-${uniqueNumber}`;
            // ------------------------------------

            const stock = parseInt(newProductData.stock, 10);
            const productData = {
                ...newProductData,
                price: parseFloat(newProductData.price),
                fullPrice: parseFloat(newProductData.fullPrice),
                stock: isNaN(stock) ? 0 : stock,
                sku: generatedSku, // Adiciona o SKU gerado ao produto
                discountPercentage: parseFloat(newProductData.discountPercentage) || 0,
                status: (isNaN(stock) || stock === 0) ? 'Sem Estoque' : 'Ativo',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "products"), productData);

            // Adiciona o novo produto ao estado local para atualização instantânea da UI
            const newProductWithId = { id: docRef.id, ...productData };
            setProducts(prevProducts => [newProductWithId, ...prevProducts]);

            setIsAddModalOpen(false); // Fecha o modal
            setToastMessage({ type: 'success', message: 'Produto adicionado com sucesso!' });

        } catch (error) {
            console.error("Erro ao adicionar novo produto: ", error);
            setToastMessage({ type: 'error', message: 'Não foi possível adicionar o produto.' });
        }
    };

    const handleAddAd = async () => {
        // Verifica se já existe um anúncio ativo
        const adExists = products.some(p => p.status === 'Anúncio');
        if (adExists) {
            setToastMessage({ type: 'error', message: 'Apenas um anúncio é permitido. Arquive o existente para criar um novo.' });
            return;
        }

        try {
            const newAdData = {
                name: "Vitoria Mota Gandra",
                status: "Anúncio",
                brand: "Anúncio",
                image: "https://via.placeholder.com/380x380.png?text=An%C3%BAncio",
                link: "https://www.minhaloja.natura.com/consultoria/motagandra?marca=natura",
                price: 0,
                stock: 0,
                fullPrice: 0,
                sku: `AD-${Date.now()}`,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "products"), newAdData);

            // Cria um objeto completo do novo anúncio, incluindo o ID gerado pelo Firebase
            const newAdWithId = { id: docRef.id, ...newAdData };

            // Adiciona o novo anúncio ao estado local para atualização instantânea da UI
            setProducts(prevProducts => [newAdWithId, ...prevProducts]);

            setToastMessage({ type: 'success', message: 'Anúncio criado! Edite para personalizar.' });

        } catch (error) {
            console.error("Erro ao adicionar anúncio: ", error);
            setToastMessage({ type: 'error', message: 'Não foi possível criar o anúncio.' });
        }
    };

    const handleDropdownToggle = (e, productId) => {
        // Impede que o evento de clique no window feche o dropdown imediatamente
        e.stopPropagation(); 
        setActiveDropdownId(prevId => (prevId === productId ? null : productId));
    };

    const handleDeleteClick = (productId) => {
        setDeleteConfirmId(productId);
        setActiveDropdownId(null); // Fecha o dropdown
    };

    const handleDeleteProduct = async () => {
        if (!deleteConfirmId) return;
        const productRef = doc(db, "products", String(deleteConfirmId));
        try {
            await deleteDoc(productRef);
            setProducts(products.filter(p => p.id !== deleteConfirmId));
            setDeleteConfirmId(null);
            setToastMessage({ type: 'success', message: 'Produto excluído permanentemente.' });
        } catch (error) {
            console.error("Erro ao excluir produto: ", error);
            setToastMessage({ type: 'error', message: 'Não foi possível excluir o produto.' });
        }
    };

    // Variável para desabilitar o botão de anúncio se um já existir
    const adExists = products.some(p => p.status === 'Anúncio' && p.status !== 'Arquivado');

    const filteredProducts = products.filter(product => {
        const matchesView = view === 'active' ? product.status !== 'Arquivado' : product.status === 'Arquivado';
        if (!matchesView) return false;

        // Adiciona a lógica do filtro de marca
        const matchesBrand = brandFilter === 'all' || product.brand === brandFilter;
        if (!matchesBrand) return false;

        if (searchQuery.trim() === '') return true;

        const lowerCaseQuery = searchQuery.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(lowerCaseQuery);
        const skuMatch = product.sku.toLowerCase().includes(lowerCaseQuery);
        return nameMatch || skuMatch;
    });

    // Lógica da Paginação
    const productsPerPage = 6; // Aumentado para 6 para incluir o anúncio
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const brands = [
        { value: 'all', label: 'Todas' },
        { value: 'avon', label: 'Avon' },
        { value: 'boticario', label: 'Boticário' },
        { value: 'eudora', label: 'Eudora' },
        { value: 'loccitane-au-bresil', label: 'L`Occitane au Brésil' },
        { value: 'natura', label: 'Natura' },
        { value: 'oui-paris', label: 'O.U.i Paris' },
        { value: 'quem-disse-berenice', label: 'Quem disse, Berenice?' },
    ];
    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Produtos</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={handleAddProductClick}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                    >
                        <PlusCircle size={16} />
                        Adicionar Produto
                    </button>
                    <button 
                        onClick={handleAddAd} 
                        disabled={adExists}
                        title={adExists ? "Apenas um anúncio é permitido." : "Criar um card de anúncio"}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Megaphone size={16} />
                        Adicionar Anúncio
                    </button>
                </div>
            </div>

            {/* Filters and Tabs */}
            <div className="bg-white p-4 rounded-2xl shadow-sm">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        onClick={() => setView('active')}
                        className={`px-4 py-2 text-sm font-semibold ${view === 'active' ? 'text-[#8B0000] border-b-2 border-[#8B0000]' : 'text-gray-500'}`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => setView('archived')}
                        className={`px-4 py-2 text-sm font-semibold ${view === 'archived' ? 'text-[#8B0000] border-b-2 border-[#8B0000]' : 'text-gray-500'}`}
                    >
                        Arquivados
                    </button>
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-grow">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou SKU..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Filters */}
                    <div className="flex gap-2">
                        <div className="relative">
                            {/* Mobile Popup Button - Hidden on md screens and up */}
                            <button 
                                onClick={() => setIsBrandPopupOpen(true)}
                                className="md:hidden w-full bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50 capitalize flex justify-between items-center"
                            >
                                <span>Marca: {brands.find(b => b.value === brandFilter)?.label}</span>
                                <ChevronDown size={18} className="text-gray-400" />
                            </button>

                            {/* Desktop Select Dropdown - Hidden on screens smaller than md */}
                            <div className="hidden md:block relative">
                                <select 
                                    value={brandFilter}
                                    onChange={(e) => setBrandFilter(e.target.value)}
                                    className="appearance-none w-full bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50 capitalize"
                                >
                                    {brands.map(brand => <option key={brand.value} value={brand.value}>{brand.label}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Table */}
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="p-4 w-2/5">Produto</th>
                                <th scope="col" className="p-4">Marca</th>
                                <th scope="col" className="p-4">Preço</th>
                                <th scope="col" className="p-4">Estoque</th>
                                <th scope="col" className="p-4">Status</th>
                                <th scope="col" className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-8">Carregando produtos...</td></tr>
                            ) : (
                                currentProducts.map(product => (
                                <ProductRow 
                                    key={product.id} 
                                    product={product} 
                                    view={view} 
                                    onArchiveClick={setArchiveConfirmId} 
                                    onRestore={handleRestoreProduct} 
                                    onEditClick={handleEditClick}
                                    onDeleteClick={handleDeleteClick}
                                    onDropdownToggle={(e, id) => handleDropdownToggle(e, id)}
                                    activeDropdownId={activeDropdownId} />
                            ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                        Mostrando {Math.min(indexOfFirstProduct + 1, filteredProducts.length)} a {Math.min(indexOfLastProduct, filteredProducts.length)} de {filteredProducts.length} produtos
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            Página {currentPage} de {totalPages > 0 ? totalPages : 1}
                        </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Brand Filter Popup */}
            {isBrandPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setIsBrandPopupOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl p-4 w-11/12 max-w-xs" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4 text-gray-800">Selecionar Marca</h3>
                        <div className="flex flex-col gap-2">
                            {brands.map(brand => (
                                <button
                                    key={brand.value}
                                    onClick={() => {
                                        setBrandFilter(brand.value);
                                        setIsBrandPopupOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg capitalize text-gray-700 ${brandFilter === brand.value ? 'bg-red-100 font-semibold' : 'hover:bg-gray-100'}`}
                                >
                                    {brand.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Confirmation Popup */}
            {archiveConfirmId && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-11/12 max-w-md text-center">
                        <div className="mx-auto bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                            <AlertTriangle size={32} className="text-red-600" />
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-gray-900">Confirmar Arquivamento</h3>
                        <p className="text-gray-600 mb-8">
                            Tem certeza que deseja arquivar este produto? Ele será movido para a aba "Arquivados".
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setArchiveConfirmId(null)}
                                className="px-8 py-3 rounded-lg bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleArchiveProduct(archiveConfirmId)}
                                className="px-8 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                            >
                                Sim, Arquivar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-11/12 max-w-md text-center relative">
                        <button onClick={() => setDeleteConfirmId(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
                            <X size={20} />
                        </button>
                        <div className="mx-auto bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                            <Trash2 size={32} className="text-red-600" />
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-gray-900">Excluir permanentemente?</h3>
                        <p className="text-gray-600 mb-8">
                            Esta ação não pode ser desfeita. O produto será removido do banco de dados.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-8 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                            >
                                Não
                            </button>
                            <button
                                onClick={handleDeleteProduct}
                                className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                            >
                                Sim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="font-bold text-xl text-gray-900">Adicionar Novo Produto</h3>
                            <button onClick={() => setIsAddModalOpen(null)} className="p-2 rounded-full hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Nome do Produto</label>
                                    <input type="text" name="name" value={newProductData.name} onChange={handleNewProductChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Link da Imagem</label>
                                    <input type="text" name="image" value={newProductData.image} onChange={handleNewProductChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Marca</label>
                                    <select name="brand" value={newProductData.brand} onChange={handleNewProductChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50 capitalize">
                                        <option value="boticario">Boticário</option>
                                        <option value="eudora">Eudora</option>
                                        <option value="loccitane-au-bresil">L’Occitane au Brésil</option>
                                        <option value="natura">Natura</option>
                                        <option value="avon">Avon</option>
                                        <option value="oui-paris">O.U.i Paris</option>
                                        <option value="quem-disse-berenice">Quem disse, Berenice?</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Estoque</label>
                                    <input type="number" name="stock" value={newProductData.stock} onChange={handleNewProductChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Valor Cheio (R$)</label> 
                                    <input type="number" name="fullPrice" value={newProductData.fullPrice} onChange={handleNewProductChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" placeholder="Ex: 100.00" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Desconto (%)</label>
                                    <input type="number" name="discountPercentage" value={newProductData.discountPercentage} onChange={handleNewProductChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" placeholder="Ex: 20" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Preço Final de Venda (R$)</label>
                                    <input type="number" name="price" value={newProductData.price} onChange={handleNewProductChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" placeholder="Ex: 79.90" />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end items-center gap-4 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-lg bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleAddNewProduct} className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">
                                Adicionar Produto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="font-bold text-xl text-gray-900">Editar Produto</h3>
                            <button onClick={() => setEditingProduct(null)} className="p-2 rounded-full hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Link da Imagem</label>
                                    <input type="text" name="image" value={editFormData.image || ''} onChange={handleEditFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Nome do Produto/Anúncio</label>
                                    <input type="text" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" />
                                </div>

                                {editFormData.status !== 'Anúncio' ? (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Marca</label>
                                            <select name="brand" value={editFormData.brand || ''} onChange={handleEditFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50 capitalize">
                                                <option value="boticario">Boticário</option>                                                <option value="eudora">Eudora</option>
                                                <option value="loccitane-au-bresil">L’Occitane au Brésil</option>
                                                <option value="natura">Natura</option>                                                <option value="avon">Avon</option>
                                                <option value="oui-paris">O.U.i Paris</option>
                                                <option value="quem-disse-berenice">Quem disse, Berenice?</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Estoque</label>
                                            <input type="number" name="stock" value={editFormData.stock || 0} onChange={handleEditFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Valor Cheio (R$)</label>
                                            <input type="number" name="fullPrice" value={editFormData.fullPrice || 0} onChange={handleEditFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Desconto (%)</label>
                                            <input type="number" name="discountPercentage" value={editFormData.discountPercentage || ''} onChange={handleEditFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" placeholder="Ex: 20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Preço de Venda (R$)</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <input type="number" name="price" value={editFormData.price || 0} onChange={handleEditFormChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" />
                                                {calculateDiscount(editFormData.fullPrice, editFormData.price) && (
                                                    <div className="flex-shrink-0 flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                                                        <Percent size={12} />
                                                        {(((editFormData.fullPrice - editFormData.price) / editFormData.fullPrice) * 100).toFixed(0)}% OFF
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Link do Anúncio</label>
                                        <input type="text" name="link" value={editFormData.link || ''} onChange={handleEditFormChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50" placeholder="https://www.minhaloja.natura.com/..." />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            {parseInt(editFormData.stock, 10) === 0 && (
                                <p className="text-sm text-yellow-700 font-medium text-center sm:text-left flex-grow">
                                    O status será alterado para "Sem Estoque" ao salvar.
                                </p>
                            )}
                            {view === 'active' ? (
                                <button
                                    onClick={() => handleUpdateProduct(false)}
                                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gray-800 text-white font-semibold hover:bg-black"
                                >
                                    Salvar Alterações
                                </button>
                            ) : ( // view === 'archived'
                                <button
                                    onClick={() => handleUpdateProduct(true)}
                                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                                >
                                    Salvar e Publicar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toastMessage && (
                <div 
                    className={`fixed top-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-lg shadow-2xl animate-fade-in-down
                        ${toastMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                    {toastMessage.type === 'success' 
                        ? <CheckCircle size={22} className="text-green-600" /> 
                        : <AlertCircle size={22} className="text-red-600" />
                    }
                    <span className="font-medium">{toastMessage.message}</span>
                    <button onClick={() => setToastMessage(null)} className="p-1 rounded-full hover:bg-black/10">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;