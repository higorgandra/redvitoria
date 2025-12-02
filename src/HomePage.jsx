import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Star, Truck, MessageCircle, MapPin, Check, Package, ChevronLeft, ChevronRight, Instagram, ChevronDown } from 'lucide-react';
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
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false); // Estado para o modal de marcas
    const [showNotification, setShowNotification] = useState(false);
    const [heroImageIndex, setHeroImageIndex] = useState(0);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
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
      if (isMenuOpen || isBrandModalOpen) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
      // Função de limpeza para garantir que o scroll seja reativado se o componente for desmontado
      return () => {
        document.body.classList.remove('overflow-hidden');
      };
    }, [isMenuOpen, isBrandModalOpen]);
  
    // Reseta para a primeira página sempre que a marca ativa for alterada
    useEffect(() => {
      setCurrentPage(1);
    }, [activeBrand]);

    // Filtra os produtos pela marca selecionada
    const brandFilteredProducts = activeBrand === 'all'
      ? products
      : products.filter(p => p.brand === activeBrand);

    // Reordena a lista para que o card de anúncio seja sempre o último
    const filteredProducts = [...brandFilteredProducts].sort((a, b) => {
      if (a.status === 'Anúncio') return 1; // Move 'a' para o final
      if (b.status === 'Anúncio') return -1; // Move 'b' para o final (deixando 'a' antes)
      return 0; // Mantém a ordem para os outros produtos
    });
  
    // Lógica da Paginação
    const productsPerPage = 12;
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
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
                  <Link to="/redessociais" className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50 transition">
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
                  <Link to="/redessociais" className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50 transition">
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
              
              <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-4 md:mt-0 w-full md:w-auto">
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
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                      Página {currentPage} de {totalPages}
                  </span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
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
              href="https://www.instagram.com/consultoravitoriamgandra" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-6 text-gray-500 hover:text-[#8B0000] transition"
              aria-label="Siga-nos no Instagram"
            >
              <Instagram size={28} />
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