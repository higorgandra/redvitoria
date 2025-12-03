import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, X, MapPin, Check, Package, ChevronLeft, ChevronRight, Instagram, ChevronDown, ArrowUpDown } from 'lucide-react';
import LogoSlider from './LogoSlider';
import FeaturesSection from './FeaturesSection';
import ProductCard from './ProductCard';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const brandColors = {
    boticario: "bg-green-700",
    natura: "bg-orange-500",
    avon: "bg-pink-600",
    eudora: "bg-purple-700",
    'quem-disse-berenice': "bg-pink-500",
    'loccitane-au-bresil': "bg-yellow-500",
    'oui-paris': "bg-amber-500",
    all: "bg-gray-800"
};

const HomePage = ({ cart, addToCart }) => {
    const [activeBrand, setActiveBrand] = useState('all');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false); // Estado para o modal de preço
    const [showNotification, setShowNotification] = useState(false);
    const [heroImageIndex, setHeroImageIndex] = useState(0);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [priceSort, setPriceSort] = useState(null); // Estado para ordenação: 'asc', 'desc', ou null
    const [currentPage, setCurrentPage] = useState(1);

    // Efeito para buscar os produtos do Firestore
    const brands = [
      { value: 'all', label: 'Todos' },
      { value: 'natura', label: 'Natura' },
      { value: 'boticario', label: 'Boticário' },
      { value: 'avon', label: 'Avon' },
      { value: 'eudora', label: 'Eudora' },
      { value: 'quem-disse-berenice', label: 'Quem disse, Berenice?' },
      { value: 'loccitane-au-bresil', label: 'L’Occitane au Brésil' },
      { value: 'oui-paris', label: 'O.U.i Paris' },
    ];
    const selectedBrandLabel = brands.find(b => b.value === activeBrand)?.label || 'Selecionar Marca';

    useEffect(() => {
      const fetchProducts = async () => {
        setLoading(true);
        // Cria uma query para buscar apenas produtos que NÃO estão arquivados
        const q = query(collection(db, "products"), where("status", "!=", "Arquivado"));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsList);
        setLoading(false);
      };
      fetchProducts();
    }, []);
  
    // Efeito para alternar a imagem do hero
    useEffect(() => {
      if (products.length === 0) return;
      const imageInterval = setInterval(() => {
        setHeroImageIndex(prevIndex => (prevIndex + 1) % products.length);
      }, 4000);
      return () => clearInterval(imageInterval);
    }, [products]);
  
    // Efeito para bloquear o scroll do body quando um modal/menu está aberto
    useEffect(() => {
      if (isMenuOpen || isBrandModalOpen || isPriceModalOpen) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
      // Função de limpeza para garantir que o scroll seja reativado se o componente for desmontado
      return () => {
        document.body.classList.remove('overflow-hidden');
      };
    }, [isMenuOpen, isBrandModalOpen, isPriceModalOpen]);
  
    // Reseta para a primeira página sempre que a marca ativa for alterada
    useEffect(() => {
      setCurrentPage(1);
    }, [activeBrand]);

    // Aplica a ordenação por preço, se definida
    const sortedProducts = [...products].sort((a, b) => {
      // Ignora produtos do tipo 'Anúncio' da ordenação de preço
      if (a.status === 'Anúncio' || b.status === 'Anúncio') return 0;
      if (priceSort === 'asc') {
        return a.price - b.price;
      }
      if (priceSort === 'desc') {
        return b.price - a.price;
      }
      // Se não houver ordenação de preço, mantém a ordem padrão (pode ser por data de criação, etc.)
      return 0;
    });

    // Filtra os produtos pela marca selecionada APÓS a ordenação
    const brandFilteredProducts = activeBrand === 'all'
      ? sortedProducts
      : sortedProducts.filter(p => p.brand === activeBrand);

    // Reordena a lista para que o card de anúncio seja sempre o último
    const finalProductList = [...brandFilteredProducts].sort((a, b) => {
      if (a.status === 'Anúncio') return 1; // Move 'a' para o final
      if (b.status === 'Anúncio') return -1; // Move 'b' para o final (deixando 'a' antes)
      return 0; // Mantém a ordem para os outros produtos
    });
  
    // Lógica da Paginação
    const productsPerPage = 12;
    const totalPages = Math.ceil(finalProductList.length / productsPerPage);
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = finalProductList.slice(indexOfFirstProduct, indexOfLastProduct);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const handleBottomPageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);

            // Adiciona um pequeno delay para garantir que o DOM seja atualizado antes de rolar.
            // Isso corrige o comportamento inconsistente em dispositivos móveis.
            setTimeout(() => {
                const targetElement = document.querySelector('#estoque');
                if (targetElement) {
                    const headerElement = document.querySelector('nav');
                    const headerOffset = headerElement ? headerElement.offsetHeight : 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }, 0); // O delay de 0ms é suficiente para empurrar a execução para o final da fila de eventos.
        }
    };

    const handleAddToCart = (product) => {
      addToCart(product);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };    

    const handleNavClick = (event, targetId) => {
      event.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
      setIsMenuOpen(false);
    };
  
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const copyrightYear = startYear === currentYear ? startYear : `${startYear} - ${currentYear}`;
  
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-800">

        {/* Top Announcement Bar */}
        <div className="bg-[#B22222] text-white py-2 px-4 text-center text-xs font-semibold tracking-wide hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 ">
            <MapPin size={14} />
            Exclusivo para Salvador/BA
          </div>
        </div>
        
        {showNotification && (
          <div className="fixed top-24 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce flex items-center gap-2">
            <Check size={20} />
            Adicionado à sacola!
          </div>
        )}
  
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex justify-center items-center h-20">
              {/* Logo Centralizado */}
              <div className="absolute left-1/2 -translate-x-1/2">
                <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center cursor-pointer">
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                      <span className="text-[#8B0000]">RED</span>VITORIA
                    </h1>
                    <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block -mt-1">
                      Pronta Entrega Salvador
                    </span>
                  </div>
                </a>
              </div>
  
              {/* Ícone do Carrinho à Direita */}
              <div className="absolute right-0 flex items-center">
                <Link to="/carrinho" className="relative p-2 hover:bg-[#B22222]/10 rounded-full transition group">
                  <ShoppingBag className="text-gray-700 group-hover:text-[#8B0000] transition" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-[#B22222] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>
  
        <section id="home" className="relative bg-white flex items-center justify-center pt-8 pb-16 md:py-24 overflow-hidden border-b border-gray-100 h-[calc(100vh-5rem)] md:h-auto">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#B22222]/10 skew-x-12 transform translate-x-20 hidden md:block"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
            {/* Mobile Layout: Centered */}
            <div className="flex flex-col items-center justify-center text-center md:hidden h-full">
              <div className="w-full">
                {/* Hero Image Carousel */}
                <div className="mb-8 flex w-full justify-center relative h-64">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-[#B22222]/20 rounded-full blur-xl"></div>
                    <div className="relative w-64 h-64">
                      {products.map((product, index) => (
                        <img 
                          key={product.id}
                          src={product.image} 
                          alt={product.name}
                          className={`absolute inset-0 rounded-2xl shadow-2xl object-cover w-full h-full border-4 border-white rotate-3 transition-opacity duration-1000 ease-in-out ${
                            index === heroImageIndex ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3">
                  Viu, gostou, pegou. <br />
                  <span className="text-[#8B0000]">Sem esperar.</span>
                </h2>

                <p className="text-base text-gray-600 mb-6 max-w-2xl leading-relaxed mx-auto">
                  Aqui na <span className="text-[#8B0000]"><strong>Vitoria</strong></span>, todos os produtos já estão comigo. Pediu hoje, chegou hoje.
                </p>
                
                <div className="flex flex-wrap justify-center items-center gap-4">
                  <a href="#estoque" onClick={(e) => handleNavClick(e, '#estoque')} className="bg-[#8B0000] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#650000] transition shadow-lg shadow-[#B22222]/30 text-center">
                    Estoque
                  </a>
                  <Link to="/social" className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    <Instagram className="text-[#8B0000]" />
                    <span className="text-sm font-semibold text-gray-700">
                      Nossos Links <br/>
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Desktop Layout: 2 Columns */}
            <div className="hidden md:flex flex-row items-center w-full">
              <div className="md:w-1/2 mb-12 md:mb-0">
                <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-[#B22222]/20 text-[#8B0000] text-xs font-bold uppercase tracking-wider mb-6">
                  <MapPin size={14} />
                  Exclusivo para Salvador
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Viu, gostou, pegou. <br />
                <span className="text-[#8B0000]">Sem esperar.</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                Aqui na <span className="text-[#8B0000]"><strong>Vitoria</strong></span>, todos os produtos já estão comigo. Pediu hoje, chegou hoje.
                </p>
                <div className="flex flex-wrap justify-start items-center gap-4">
                  <a href="#estoque" onClick={(e) => handleNavClick(e, '#estoque')} className="bg-[#8B0000] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#650000] transition shadow-lg shadow-[#B22222]/30 text-center">
                    Estoque
                  </a>
                  <Link to="/social" className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    <Instagram className="text-[#8B0000]" />
                    <span className="text-sm font-semibold text-gray-700">
                      Nossos Links <br/>
                      <span className="text-xs font-normal text-gray-500">Instagram, WhatsApp e mais</span>
                    </span>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex md:w-1/2 justify-center relative">
                <div className="relative">
                  <div className="absolute -inset-4 bg-[#B22222]/20 rounded-full blur-xl"></div>
                  <div className="relative w-72 h-72 md:w-96 md:h-96">
                    {products.map((product, index) => (
                      <img 
                        key={product.id}
                        src={product.image} 
                        alt={product.name} 
                        className={`absolute inset-0 rounded-2xl shadow-2xl object-cover w-full h-full border-4 border-white rotate-3 transition-opacity duration-1000 ease-in-out ${
                          index === heroImageIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce-slow">
                    <div className="bg-green-100 p-2 rounded-full text-green-700">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                      <p className="text-sm font-bold text-gray-900">Em Estoque</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        <section id="estoque" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 border-b border-gray-200 pb-4">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900">Vitrine de Pronta Entrega</h3>
                <p className="text-gray-500 mt-1">Itens disponíveis agora em Salvador.</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 mt-4 md:mt-0 w-full md:w-auto items-center">
                {/* Controles de Paginação no Topo */}
                {totalPages > 1 && (
                  <div className="hidden md:flex items-center gap-3">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronRight size={18} />
                    </button>
                  </div>
                )}
                {/* Botão "Todos" */}
                <button 
                  onClick={() => setActiveBrand('all')}
                  className={`px-5 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition
                    ${activeBrand === 'all' 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}
                >
                  Todos
                </button>

                {/* Botão para abrir o modal de marcas */}
                <button 
                  onClick={() => setIsBrandModalOpen(true)}
                  className={`px-5 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition flex items-center gap-2
                    ${activeBrand !== 'all' 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}
                >
                  <span className="normal-case">
                    {activeBrand === 'all' ? 'Selecionar Marca' : `Marca: ${selectedBrandLabel}`}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {/* Botão para abrir o modal de preço */}
                <button 
                  onClick={() => setIsPriceModalOpen(true)}
                  className={`px-5 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition flex items-center gap-2
                    ${priceSort 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}
                >
                  <span className="normal-case">
                    {priceSort === 'asc' ? 'Menor Preço' : priceSort === 'desc' ? 'Maior Preço' : 'Preço'}
                  </span>
                  <ArrowUpDown size={16} />
                </button>
              </div>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <p className="col-span-full text-center py-8 text-gray-500">Carregando vitrine...</p>
              ) : (
                currentProducts.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    brandColors={brandColors}
                    onAddToCart={handleAddToCart}
                  />
                ))
              )}
            </div>

            {/* Pagination Controls for HomePage */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-4">
                  <button onClick={() => handleBottomPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                      Página {currentPage} de {totalPages}
                  </span>
                  <button onClick={() => handleBottomPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      <ChevronRight size={20} />
                  </button>
              </div>
            )}

          </div>
        </section>

        {/* Modal de Filtro de Marcas */}
        {isBrandModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={() => setIsBrandModalOpen(false)}>
                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl text-gray-800">Filtrar por Marca</h3>
                      <button onClick={() => setIsBrandModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                          <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {brands.filter(b => b.value !== 'all').map(brand => (
                            <button
                                key={brand.value}
                                onClick={() => {
                                    setActiveBrand(brand.value);
                                    setIsBrandModalOpen(false);
                                }}
                                className={`w-full text-left p-4 rounded-lg text-gray-700 font-semibold transition ${activeBrand === brand.value ? 'bg-red-100 text-red-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                {brand.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
  
        {/* Modal de Filtro de Preço */}
        {isPriceModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={() => setIsPriceModalOpen(false)}>
                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl text-gray-800">Ordenar por Preço</h3>
                      <button onClick={() => setIsPriceModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                          <X size={20} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => { setPriceSort(null); setIsPriceModalOpen(false); }}
                            className={`w-full text-left p-4 rounded-lg text-gray-700 font-semibold transition ${priceSort === null ? 'bg-red-100 text-red-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Nenhum
                        </button>
                        <button
                            onClick={() => { setPriceSort('asc'); setIsPriceModalOpen(false); }}
                            className={`w-full text-left p-4 rounded-lg text-gray-700 font-semibold transition ${priceSort === 'asc' ? 'bg-red-100 text-red-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Menor Preço
                        </button>
                        <button
                            onClick={() => { setPriceSort('desc'); setIsPriceModalOpen(false); }}
                            className={`w-full text-left p-4 rounded-lg text-gray-700 font-semibold transition ${priceSort === 'desc' ? 'bg-red-100 text-red-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Maior Preço
                        </button>
                    </div>
                </div>
            </div>
        )}

        <LogoSlider />
  
        <FeaturesSection />
  
        <footer id="contato" className="bg-white pt-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center mb-8">
            <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="cursor-pointer">
              <div>
                <h2 className="text-xl font-black text-gray-900">RED<span className="text-[#B22222]">VITORIA</span></h2>
                <p className="text-sm text-gray-500 mt-1">Sua loja de pronta entrega em Salvador.</p>
              </div>
            </a>
            <a 
              href="https://transparencyreport.google.com/safe-browsing/search?url=https:%2F%2Fredvitoria.pages.dev%2F&hl=pt_PT" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-6"
              aria-label="Siga-nos no Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="160.714" height="58.354" viewBox="0 0 160.714 58.354">
                <g id="Grupo_2237" data-name="Grupo 2237" transform="translate(3582.477 -8343.162)">
                  <path id="shield-check-sharp-solid" d="M43.36,0l1.322.513L68.331,9.688l2.188.843.137,2.336a52.493,52.493,0,0,1-4.251,22.9A41.151,41.151,0,0,1,44.819,57.715l-1.459.638-1.447-.627A41.034,41.034,0,0,1,20.327,35.776a52.187,52.187,0,0,1-4.251-22.9l.137-2.336,2.177-.855L42.038.513ZM56.239,23.82l1.938-1.938L54.3,18.019l-1.938,1.938L39.713,32.607l-5.357-5.357-1.938-1.938-3.864,3.864,1.938,1.938,7.294,7.294,1.938,1.938,1.938-1.938Z" transform="translate(-3598.485 8343.162)" fill="#43d13e"/>
                  <g id="Grupo_2236" data-name="Grupo 2236" transform="translate(-3578 8340.162)">
                    <path id="Caminho_8207" data-name="Caminho 8207" d="M6.552.273A7.156,7.156,0,0,1,4.216-.11a5.934,5.934,0,0,1-1.958-1.1A4.087,4.087,0,0,1,1.05-2.94l2.4-.882a1.686,1.686,0,0,0,.6.767,3.62,3.62,0,0,0,1.1.556,4.523,4.523,0,0,0,1.4.21,4.261,4.261,0,0,0,1.433-.236,2.729,2.729,0,0,0,1.076-.661,1.386,1.386,0,0,0,.41-.992,1.2,1.2,0,0,0-.431-.95,3.175,3.175,0,0,0-1.1-.593,9.1,9.1,0,0,0-1.386-.336,12.493,12.493,0,0,1-2.8-.745A4.749,4.749,0,0,1,1.79-8.2a3.566,3.566,0,0,1-.719-2.31,3.717,3.717,0,0,1,.766-2.331A5.107,5.107,0,0,1,3.854-14.4a6.557,6.557,0,0,1,2.7-.557,7.261,7.261,0,0,1,2.331.378,5.862,5.862,0,0,1,1.969,1.1,4.1,4.1,0,0,1,1.213,1.743l-2.415.872a1.686,1.686,0,0,0-.6-.766,3.536,3.536,0,0,0-1.1-.551,4.63,4.63,0,0,0-1.4-.2,3.876,3.876,0,0,0-1.412.236,2.966,2.966,0,0,0-1.087.667,1.328,1.328,0,0,0-.42.966A1.36,1.36,0,0,0,4.027-9.45a2.391,2.391,0,0,0,1.055.52q.662.163,1.47.3a11.045,11.045,0,0,1,2.72.777A5.329,5.329,0,0,1,11.277-6.4a3.356,3.356,0,0,1,.756,2.221,3.773,3.773,0,0,1-.756,2.336A5,5,0,0,1,9.272-.284,6.608,6.608,0,0,1,6.552.273ZM14.742,0V-14.7H17.3V0ZM31.269-14.7v2.562H26.775V0H24.213V-12.138H19.719V-14.7ZM33.369,0V-14.7h9.219v2.562H35.931v2.982h5.282v2.562H35.931v4.032h6.657V0Zm18,0V-12.138H49.518l.693-2.562h3.717V0ZM61.961.273A4.656,4.656,0,0,1,59.63-.32a5.683,5.683,0,0,1-1.811-1.643,7.957,7.957,0,0,1-1.171-2.431,10.348,10.348,0,0,1-.41-2.956,10.348,10.348,0,0,1,.41-2.956,7.957,7.957,0,0,1,1.171-2.431A5.683,5.683,0,0,1,59.63-14.38a4.656,4.656,0,0,1,2.331-.593,4.656,4.656,0,0,1,2.331.593,5.578,5.578,0,0,1,1.8,1.643,8.2,8.2,0,0,1,1.165,2.431,10.226,10.226,0,0,1,.415,2.956,10.226,10.226,0,0,1-.415,2.956,8.2,8.2,0,0,1-1.165,2.431,5.578,5.578,0,0,1-1.8,1.643A4.656,4.656,0,0,1,61.961.273Zm0-2.562A2.559,2.559,0,0,0,63.819-3a4.329,4.329,0,0,0,1.092-1.869,8.349,8.349,0,0,0,.357-2.478A8.119,8.119,0,0,0,64.89-9.9a4.254,4.254,0,0,0-1.113-1.832,2.569,2.569,0,0,0-1.816-.682A2.605,2.605,0,0,0,60.485-12a3.291,3.291,0,0,0-1.034,1.129,5.7,5.7,0,0,0-.609,1.622,8.811,8.811,0,0,0-.2,1.9A8.252,8.252,0,0,0,59-4.877,4.343,4.343,0,0,0,60.107-3,2.563,2.563,0,0,0,61.961-2.289ZM74.172.273A4.656,4.656,0,0,1,71.841-.32,5.683,5.683,0,0,1,70.03-1.964a7.957,7.957,0,0,1-1.171-2.431,10.348,10.348,0,0,1-.41-2.956,10.348,10.348,0,0,1,.41-2.956,7.957,7.957,0,0,1,1.171-2.431,5.683,5.683,0,0,1,1.811-1.643,4.656,4.656,0,0,1,2.331-.593,4.656,4.656,0,0,1,2.331.593,5.578,5.578,0,0,1,1.8,1.643,8.2,8.2,0,0,1,1.165,2.431,10.226,10.226,0,0,1,.415,2.956,10.226,10.226,0,0,1-.415,2.956A8.2,8.2,0,0,1,78.3-1.964,5.578,5.578,0,0,1,76.5-.32,4.656,4.656,0,0,1,74.172.273Zm0-2.562A2.559,2.559,0,0,0,76.031-3a4.329,4.329,0,0,0,1.092-1.869A8.349,8.349,0,0,0,77.48-7.35,8.119,8.119,0,0,0,77.1-9.9a4.254,4.254,0,0,0-1.113-1.832,2.569,2.569,0,0,0-1.816-.682A2.605,2.605,0,0,0,72.7-12a3.291,3.291,0,0,0-1.034,1.129,5.7,5.7,0,0,0-.609,1.622,8.811,8.811,0,0,0-.2,1.9,8.252,8.252,0,0,0,.362,2.473A4.343,4.343,0,0,0,72.319-3,2.563,2.563,0,0,0,74.172-2.289ZM82.709,0l8.484-14.7h2.961L85.67,0Zm1.806-8.327a3.107,3.107,0,0,1-1.58-.415,3.173,3.173,0,0,1-1.15-1.129,3.031,3.031,0,0,1-.431-1.6,3.042,3.042,0,0,1,.436-1.617,3.173,3.173,0,0,1,1.155-1.123,3.118,3.118,0,0,1,1.57-.41,3.049,3.049,0,0,1,1.575.42,3.187,3.187,0,0,1,1.139,1.134,3.059,3.059,0,0,1,.425,1.6,3.022,3.022,0,0,1-.436,1.606,3.186,3.186,0,0,1-1.15,1.124A3.07,3.07,0,0,1,84.515-8.327Zm0-1.753a1.342,1.342,0,0,0,.976-.4,1.328,1.328,0,0,0,.41-.982,1.323,1.323,0,0,0-.41-.987,1.351,1.351,0,0,0-.976-.4,1.381,1.381,0,0,0-.992.4,1.315,1.315,0,0,0-.415.987,1.32,1.32,0,0,0,.415.982A1.372,1.372,0,0,0,84.515-10.08ZM92.348-.073a2.984,2.984,0,0,1-1.586-.436,3.259,3.259,0,0,1-1.134-1.155,3.019,3.019,0,0,1-.42-1.549,3.042,3.042,0,0,1,.436-1.617A3.215,3.215,0,0,1,90.8-5.959a3.049,3.049,0,0,1,1.549-.415,3.014,3.014,0,0,1,1.617.441,3.258,3.258,0,0,1,1.129,1.16,3.068,3.068,0,0,1,.415,1.559,3.02,3.02,0,0,1-.425,1.575A3.216,3.216,0,0,1,93.938-.5,3.067,3.067,0,0,1,92.348-.073Zm0-1.754a1.357,1.357,0,0,0,1-.41,1.333,1.333,0,0,0,.41-.977,1.357,1.357,0,0,0-.41-1,1.357,1.357,0,0,0-1-.41,1.333,1.333,0,0,0-.977.41,1.357,1.357,0,0,0-.41,1,1.333,1.333,0,0,0,.41.977A1.333,1.333,0,0,0,92.348-1.827ZM7.488,21.312a8.178,8.178,0,0,1-2.67-.438,6.782,6.782,0,0,1-2.238-1.26A4.671,4.671,0,0,1,1.2,17.64l2.748-1.008a1.927,1.927,0,0,0,.684.876,4.137,4.137,0,0,0,1.26.636,5.169,5.169,0,0,0,1.6.24,4.87,4.87,0,0,0,1.638-.27,3.119,3.119,0,0,0,1.23-.756,1.584,1.584,0,0,0,.468-1.134,1.373,1.373,0,0,0-.492-1.086,3.629,3.629,0,0,0-1.26-.678,10.4,10.4,0,0,0-1.584-.384,14.278,14.278,0,0,1-3.2-.852,5.428,5.428,0,0,1-2.238-1.6,4.076,4.076,0,0,1-.822-2.64A4.248,4.248,0,0,1,2.1,6.324,5.837,5.837,0,0,1,4.4,4.548a7.493,7.493,0,0,1,3.084-.636,8.3,8.3,0,0,1,2.664.432A6.7,6.7,0,0,1,12.4,5.6,4.68,4.68,0,0,1,13.788,7.6l-2.76,1a1.927,1.927,0,0,0-.684-.876,4.042,4.042,0,0,0-1.26-.63,5.291,5.291,0,0,0-1.6-.234,4.43,4.43,0,0,0-1.614.27,3.389,3.389,0,0,0-1.242.762,1.518,1.518,0,0,0-.48,1.1A1.554,1.554,0,0,0,4.6,10.2a2.733,2.733,0,0,0,1.206.594q.756.186,1.68.342a12.623,12.623,0,0,1,3.108.888,6.09,6.09,0,0,1,2.292,1.662,3.835,3.835,0,0,1,.864,2.538,4.312,4.312,0,0,1-.864,2.67A5.719,5.719,0,0,1,10.6,20.676,7.552,7.552,0,0,1,7.488,21.312Zm9-.312V4.2H27.024V7.128H19.416v3.408h6.036v2.928H19.416v4.608h7.608V21Zm20.868.312a7.785,7.785,0,0,1-3.258-.684,8.1,8.1,0,0,1-2.622-1.89A9,9,0,0,1,29.1,12.576a8.753,8.753,0,0,1,.678-3.48A8.559,8.559,0,0,1,34.3,4.548a7.84,7.84,0,0,1,6.636.21,8.424,8.424,0,0,1,3.018,2.61l-2.616,1.4A5.252,5.252,0,0,0,39.5,7.3a4.9,4.9,0,0,0-4.14-.054,5.4,5.4,0,0,0-1.716,1.218,5.826,5.826,0,0,0-1.182,1.848,6.105,6.105,0,0,0-.432,2.322,5.97,5.97,0,0,0,.42,2.238,5.8,5.8,0,0,0,1.158,1.836,5.407,5.407,0,0,0,1.71,1.23,4.965,4.965,0,0,0,2.088.444,4.653,4.653,0,0,0,1.458-.234,5.056,5.056,0,0,0,1.344-.678,5.33,5.33,0,0,0,1.128-1.08,6.2,6.2,0,0,0,.834-1.44h-3.06V12.4h6.5a8.79,8.79,0,0,1-.576,3.444,8.9,8.9,0,0,1-1.764,2.844,8.294,8.294,0,0,1-2.652,1.932A7.711,7.711,0,0,1,37.356,21.312Zm17.22,0a6.352,6.352,0,0,1-3.534-.984,6.68,6.68,0,0,1-2.358-2.646,8.063,8.063,0,0,1-.84-3.69V4.2h2.928v9.792a5.313,5.313,0,0,0,.45,2.2,3.813,3.813,0,0,0,1.3,1.6,3.873,3.873,0,0,0,4.122,0,3.745,3.745,0,0,0,1.278-1.6,5.438,5.438,0,0,0,.438-2.2V4.2h2.928v9.792a8.31,8.31,0,0,1-.48,2.85,7.2,7.2,0,0,1-1.368,2.334,6.278,6.278,0,0,1-2.118,1.572A6.5,6.5,0,0,1,54.576,21.312ZM63.888,21V4.2h6.444a4.6,4.6,0,0,1,2.472.684,5.072,5.072,0,0,1,2.4,4.368,5.2,5.2,0,0,1-.414,2.094A4.95,4.95,0,0,1,73.638,13a5.016,5.016,0,0,1-1.7,1.056L75.96,21H72.588L68.7,14.316H66.816V21Zm2.928-9.612H70a2.161,2.161,0,0,0,1.14-.312,2.38,2.38,0,0,0,.828-.84,2.395,2.395,0,0,0,0-2.364,2.38,2.38,0,0,0-.828-.84A2.161,2.161,0,0,0,70,6.72h-3.18Zm18.7,9.924a7.688,7.688,0,0,1-3.2-.678,8.357,8.357,0,0,1-2.64-1.878,8.9,8.9,0,0,1-1.788-2.778,9.129,9.129,0,0,1,0-6.756,8.9,8.9,0,0,1,1.788-2.778,8.357,8.357,0,0,1,2.64-1.878,7.938,7.938,0,0,1,6.42,0,8.357,8.357,0,0,1,2.64,1.878A8.862,8.862,0,0,1,93.792,12.6a8.862,8.862,0,0,1-2.424,6.156,8.357,8.357,0,0,1-2.64,1.878A7.717,7.717,0,0,1,85.512,21.312Zm0-2.928a4.828,4.828,0,0,0,2.076-.456,5.48,5.48,0,0,0,1.71-1.254,5.876,5.876,0,0,0,1.152-1.842,6.2,6.2,0,0,0-.006-4.47A5.873,5.873,0,0,0,89.286,8.52a5.547,5.547,0,0,0-1.7-1.248,4.94,4.94,0,0,0-4.146,0,5.48,5.48,0,0,0-1.71,1.254,5.876,5.876,0,0,0-1.152,1.842,6.048,6.048,0,0,0,1.164,6.318,5.421,5.421,0,0,0,1.7,1.248A4.842,4.842,0,0,0,85.512,18.384Z" transform="translate(59.498 23)" fill="#797979"/>
                    <path id="Caminho_8208" data-name="Caminho 8208" d="M3.84.13A3.2,3.2,0,0,1,2.505-.153a3.453,3.453,0,0,1-1.1-.783,3.7,3.7,0,0,1-.74-1.157A3.7,3.7,0,0,1,.4-3.5,3.712,3.712,0,0,1,.668-4.913a3.666,3.666,0,0,1,.74-1.155,3.472,3.472,0,0,1,1.1-.78A3.2,3.2,0,0,1,3.84-7.13a3.2,3.2,0,0,1,1.565.393A3.529,3.529,0,0,1,6.59-5.69L5.5-5.105a2.2,2.2,0,0,0-.733-.585,2.037,2.037,0,0,0-.927-.22,2.034,2.034,0,0,0-.865.188,2.221,2.221,0,0,0-.71.52,2.428,2.428,0,0,0-.475.77,2.552,2.552,0,0,0-.17.933,2.513,2.513,0,0,0,.173.935A2.472,2.472,0,0,0,2.27-1.8a2.23,2.23,0,0,0,.707.52,2.017,2.017,0,0,0,.862.188,2.009,2.009,0,0,0,.932-.223A2.241,2.241,0,0,0,5.5-1.9l1.09.59A3.577,3.577,0,0,1,5.405-.265,3.183,3.183,0,0,1,3.84.13ZM8.335,0V-7h4.39v1.22H9.555v1.42H12.07v1.22H9.555v1.92h3.17V0ZM14.65,0V-7h2.685a1.916,1.916,0,0,1,1.03.285,2.1,2.1,0,0,1,.73.762,2.111,2.111,0,0,1,.27,1.058,2.168,2.168,0,0,1-.173.872,2.062,2.062,0,0,1-.48.687,2.09,2.09,0,0,1-.708.44L19.68,0h-1.4l-1.62-2.785H15.87V0Zm1.22-4.005h1.325a.9.9,0,0,0,.475-.13.992.992,0,0,0,.345-.35.945.945,0,0,0,.13-.49.955.955,0,0,0-.13-.495.992.992,0,0,0-.345-.35.9.9,0,0,0-.475-.13H15.87ZM26.585-7v1.22h-2.14V0h-1.22V-5.78h-2.14V-7Zm1.95,7V-7h1.22V0Zm3.37,0V-7H36.04v1.22H33.125v1.42H35.56v1.22H33.125V0Zm5.81,0V-7h1.22V0Zm6.61.13A3.2,3.2,0,0,1,42.99-.153a3.453,3.453,0,0,1-1.1-.783,3.7,3.7,0,0,1-.74-1.157A3.7,3.7,0,0,1,40.885-3.5a3.712,3.712,0,0,1,.267-1.413,3.666,3.666,0,0,1,.74-1.155,3.472,3.472,0,0,1,1.1-.78,3.2,3.2,0,0,1,1.335-.283,3.2,3.2,0,0,1,1.565.393A3.529,3.529,0,0,1,47.075-5.69l-1.09.585a2.2,2.2,0,0,0-.733-.585,2.037,2.037,0,0,0-.927-.22,2.034,2.034,0,0,0-.865.188,2.221,2.221,0,0,0-.71.52,2.428,2.428,0,0,0-.475.77,2.552,2.552,0,0,0-.17.933,2.513,2.513,0,0,0,.173.935,2.472,2.472,0,0,0,.478.767,2.23,2.23,0,0,0,.708.52,2.017,2.017,0,0,0,.862.188,2.009,2.009,0,0,0,.932-.223,2.241,2.241,0,0,0,.728-.587l1.09.59A3.577,3.577,0,0,1,45.89-.265,3.183,3.183,0,0,1,44.325.13ZM51.01-7h1.405L54.96,0H53.665l-.45-1.24h-3L49.765,0H48.47Zm-.35,4.54h2.1L51.71-5.345ZM56.605,0V-7h2.32a3.394,3.394,0,0,1,1.357.273,3.546,3.546,0,0,1,1.115.755,3.546,3.546,0,0,1,.755,1.115A3.394,3.394,0,0,1,62.425-3.5a3.394,3.394,0,0,1-.272,1.358A3.546,3.546,0,0,1,61.4-1.028a3.546,3.546,0,0,1-1.115.755A3.394,3.394,0,0,1,58.925,0Zm1.22-1.22h1.1A2.2,2.2,0,0,0,59.8-1.4a2.332,2.332,0,0,0,.728-.49,2.316,2.316,0,0,0,.495-.725,2.195,2.195,0,0,0,.18-.888,2.177,2.177,0,0,0-.18-.885,2.355,2.355,0,0,0-.495-.725,2.319,2.319,0,0,0-.725-.492,2.191,2.191,0,0,0-.88-.177h-1.1ZM67.3.13a3.2,3.2,0,0,1-1.335-.282,3.482,3.482,0,0,1-1.1-.783,3.71,3.71,0,0,1-.745-1.157A3.669,3.669,0,0,1,63.85-3.5a3.669,3.669,0,0,1,.27-1.408,3.71,3.71,0,0,1,.745-1.158,3.482,3.482,0,0,1,1.1-.782A3.2,3.2,0,0,1,67.3-7.13a3.215,3.215,0,0,1,1.34.283,3.482,3.482,0,0,1,1.1.782,3.673,3.673,0,0,1,.743,1.158A3.7,3.7,0,0,1,70.75-3.5a3.7,3.7,0,0,1-.268,1.408A3.673,3.673,0,0,1,69.74-.935a3.482,3.482,0,0,1-1.1.783A3.215,3.215,0,0,1,67.3.13Zm0-1.22a2.012,2.012,0,0,0,.865-.19,2.283,2.283,0,0,0,.712-.522,2.448,2.448,0,0,0,.48-.767,2.5,2.5,0,0,0,.173-.93,2.487,2.487,0,0,0-.175-.933,2.447,2.447,0,0,0-.482-.767,2.311,2.311,0,0,0-.71-.52,2,2,0,0,0-.863-.19,2.011,2.011,0,0,0-.865.19,2.283,2.283,0,0,0-.713.523,2.448,2.448,0,0,0-.48.767,2.5,2.5,0,0,0-.173.93,2.482,2.482,0,0,0,.175.935,2.485,2.485,0,0,0,.483.767,2.258,2.258,0,0,0,.71.52A2.017,2.017,0,0,0,67.3-1.09ZM78.27.13a3.407,3.407,0,0,1-1.113-.182,2.826,2.826,0,0,1-.933-.525A1.946,1.946,0,0,1,75.65-1.4l1.145-.42a.8.8,0,0,0,.285.365,1.724,1.724,0,0,0,.525.265,2.154,2.154,0,0,0,.665.1,2.029,2.029,0,0,0,.682-.113,1.3,1.3,0,0,0,.513-.315.66.66,0,0,0,.195-.472.572.572,0,0,0-.205-.452,1.512,1.512,0,0,0-.525-.283,4.333,4.333,0,0,0-.66-.16,5.949,5.949,0,0,1-1.335-.355A2.262,2.262,0,0,1,76-3.905a1.7,1.7,0,0,1-.342-1.1,1.77,1.77,0,0,1,.365-1.11,2.432,2.432,0,0,1,.96-.74A3.122,3.122,0,0,1,78.27-7.12a3.458,3.458,0,0,1,1.11.18,2.791,2.791,0,0,1,.938.525,1.95,1.95,0,0,1,.577.83l-1.15.415a.8.8,0,0,0-.285-.365,1.684,1.684,0,0,0-.525-.263,2.2,2.2,0,0,0-.665-.1,1.846,1.846,0,0,0-.673.112,1.412,1.412,0,0,0-.518.318.632.632,0,0,0-.2.46.647.647,0,0,0,.188.505,1.139,1.139,0,0,0,.5.247q.315.078.7.142a5.259,5.259,0,0,1,1.295.37,2.538,2.538,0,0,1,.955.693,1.6,1.6,0,0,1,.36,1.058,1.8,1.8,0,0,1-.36,1.113,2.383,2.383,0,0,1-.955.743A3.147,3.147,0,0,1,78.27.13Zm7.045,0A3.407,3.407,0,0,1,84.2-.053a2.826,2.826,0,0,1-.933-.525,1.946,1.946,0,0,1-.575-.822l1.145-.42a.8.8,0,0,0,.285.365,1.724,1.724,0,0,0,.525.265,2.154,2.154,0,0,0,.665.1A2.029,2.029,0,0,0,86-1.2a1.3,1.3,0,0,0,.513-.315.66.66,0,0,0,.195-.472.572.572,0,0,0-.205-.452,1.512,1.512,0,0,0-.525-.283,4.333,4.333,0,0,0-.66-.16A5.949,5.949,0,0,1,83.98-3.24a2.262,2.262,0,0,1-.933-.665,1.7,1.7,0,0,1-.342-1.1,1.77,1.77,0,0,1,.365-1.11,2.432,2.432,0,0,1,.96-.74,3.122,3.122,0,0,1,1.285-.265,3.458,3.458,0,0,1,1.11.18,2.791,2.791,0,0,1,.938.525,1.95,1.95,0,0,1,.577.83l-1.15.415a.8.8,0,0,0-.285-.365A1.684,1.684,0,0,0,85.98-5.8a2.2,2.2,0,0,0-.665-.1,1.846,1.846,0,0,0-.673.112,1.412,1.412,0,0,0-.518.318.632.632,0,0,0-.2.46.647.647,0,0,0,.188.505,1.139,1.139,0,0,0,.5.247q.315.078.7.142a5.259,5.259,0,0,1,1.295.37,2.538,2.538,0,0,1,.955.693,1.6,1.6,0,0,1,.36,1.058,1.8,1.8,0,0,1-.36,1.113,2.383,2.383,0,0,1-.955.743A3.147,3.147,0,0,1,85.315.13ZM89.865,0V-7h1.22v5.78H94V0Z" transform="translate(60.5 58.354)" fill="#797979"/>
                    <line id="Linha_53" data-name="Linha 53" x2="95.237" transform="translate(60.5 47.717)" fill="none" stroke="#797979" strokeLinecap="round" strokeWidth="1"/>
                  </g>
                </g>
              </svg>
            </a>
          </div>
          <div className="bg-red-100 text-center text-red-900 text-xs py-6 px-4">
            <p>&copy; {copyrightYear} RedVitoria. Revendedora oficial independente Avon, Natura e O Boticário. Entrega grátis válida apenas para Salvador/BA.</p>
          </div>
        </footer>
      </div>
    );
  };
  
  export default HomePage;