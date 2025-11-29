import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Star, Truck, MessageCircle, MapPin, Check, Package } from 'lucide-react';
import LogoSlider from './LogoSlider';
import FeaturesSection from './FeaturesSection';
import ProductCard from './ProductCard';

// ===================================================================================
// 1. DADOS E CONSTANTES
// ===================================================================================

// Dados simulados dos produtos (Foco: Pronta Entrega)
const productsData = [
  {
    id: 1,
    name: "Malbec Desodorante Colônia",
    brand: "boticario",
    price: 199.90,
    image: "https://images.unsplash.com/photo-1585399001829-d815ab0275b2?auto=format&fit=crop&q=80&w=600",
    description: "Em estoque. Fragrância marcante e amadeirada."
  },
  {
    id: 2,
    name: "Essencial Oud Masculino",
    brand: "natura",
    price: 239.90,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=600",
    description: "Última unidade. A sofisticação do Oud com a copaíba."
  },
  {
    id: 3,
    name: "Renew Vitamina C",
    brand: "avon",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1556228852-6d35a585d566?auto=format&fit=crop&q=80&w=600",
    description: "Disponível para entrega imediata."
  },
  {
    id: 4,
    name: "Lily Eau de Parfum",
    brand: "boticario",
    price: 299.90,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600",
    description: "Original e lacrado. Pronta entrega."
  },
  {
    id: 5,
    name: "Ekos Castanha Hidratante",
    brand: "natura",
    price: 45.90,
    image: "https://images.unsplash.com/photo-1563804445-534048387309?auto=format&fit=crop&q=80&w=600",
    description: "Nutrição imediata. Leve agora."
  },
  {
    id: 6,
    name: "Power Stay Batom Líquido",
    brand: "avon",
    price: 39.90,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600",
    description: "Cores variadas em estoque em Salvador."
  }
];

const brandColors = {
  boticario: "bg-green-700",
  natura: "bg-orange-500",
  avon: "bg-pink-600",
  all: "bg-gray-800"
};

const HomePage = () => {
    const [activeBrand, setActiveBrand] = useState('all');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cart, setCart] = useState([]);
    const [showNotification, setShowNotification] = useState(false);
    const [heroImageIndex, setHeroImageIndex] = useState(0);
  
    // Efeito para alternar a imagem do hero
    useEffect(() => {
      const imageInterval = setInterval(() => {
        setHeroImageIndex(prevIndex => (prevIndex + 1) % productsData.length);
      }, 4000);
      return () => clearInterval(imageInterval);
    }, []);
  
    // Efeito para bloquear o scroll do body quando o menu mobile está aberto
    useEffect(() => {
      if (isMenuOpen) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    }, [isMenuOpen]);
  
    const filteredProducts = activeBrand === 'all' 
      ? productsData 
      : productsData.filter(p => p.brand === activeBrand);
  
    const addToCart = (product) => {
      setCart([...cart, product]);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };
  
    const checkoutWhatsApp = () => {
      let message = "Olá RedVitoria! Gostaria de reservar os itens da Pronta Entrega:\n\n";
      cart.forEach(item => {
        message += `- ${item.name} (${item.brand}): R$ ${item.price.toFixed(2)}\n`;
      });
      const total = cart.reduce((acc, item) => acc + item.price, 0);
      message += `\nTotal: R$ ${total.toFixed(2)}`;
      message += `\n\nSou de Salvador e gostaria de combinar a entrega grátis!`;
      
      const phone = "5571999999999";
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
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
        
        {showNotification && (
          <div className="fixed top-24 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce flex items-center gap-2">
            <Check size={20} />
            Adicionado à sacola!
          </div>
        )}
  
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center cursor-pointer">
                <div className="bg-[#8B0000] text-white p-2 rounded-lg mr-2 transform -rotate-3">
                  <ShoppingBag size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    RED<span className="text-[#8B0000]">VITORIA</span>
                  </h1>
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block -mt-1">
                    Pronta Entrega Salvador
                  </span>
                </div>
              </a>
  
              <div className="hidden md:flex space-x-8 items-center">
                <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="hover:text-[#8B0000] transition font-medium">Início</a>
                <a href="#estoque" onClick={(e) => handleNavClick(e, '#estoque')} className="hover:text-[#8B0000] transition font-medium">Estoque Real</a>
                <a href="#contato" onClick={(e) => handleNavClick(e, '#contato')} className="hover:text-[#8B0000] transition font-medium">Falar no Zap</a>
                
                <button 
                  onClick={checkoutWhatsApp}
                  className="relative p-2 hover:bg-[#B22222]/10 rounded-full transition group"
                >
                  <ShoppingBag className="text-gray-700 group-hover:text-[#8B0000] transition" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-[#B22222] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
  
              <div className="md:hidden flex items-center gap-4">
                <button 
                  onClick={checkoutWhatsApp}
                  className="relative p-2"
                >
                  <ShoppingBag className="text-gray-700" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-[#8B0000] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {cart.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setIsMenuOpen(true)} className="p-2">
                  <Menu />
                </button>
              </div>
            </div>
          </div>
        </nav>
  
        <section id="home" className="relative bg-white h-[calc(100vh-5rem)] flex items-center lg:h-auto lg:py-24 overflow-hidden border-b border-gray-100">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#B22222]/10 skew-x-12 transform translate-x-20"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center w-full">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-[#B22222]/20 text-[#8B0000] text-xs font-bold uppercase tracking-wider mb-6">
                <MapPin size={14} />
                Exclusivo para Salvador
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Sem espera. <br />
                <span className="text-[#8B0000]">Comprou, chegou.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                Esqueça os prazos longos de catálogo. Aqui na <strong>RedVitoria</strong>, todos os produtos já estão comigo. Pediu hoje, recebe rápido.
              </p>
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4">
                <a href="#estoque" className="bg-[#8B0000] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-bold hover:bg-[#650000] transition shadow-lg shadow-[#B22222]/30 text-center">
                  Estoque
                </a>
                <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <Truck className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Entrega Grátis <br/> <span className="text-xs font-normal text-gray-500">Apenas Salvador/BA</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex md:w-1/2 justify-center relative">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#B22222]/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-72 h-72 md:w-96 md:h-96">
                  {productsData.map((product, index) => (
                    <img 
                      key={product.id}
                      src={product.image} 
                      alt={product.name} 
                      className={`absolute inset-0 rounded-2xl shadow-2xl object-cover w-full h-full border-4 border-white rotate-3 transition-opacity duration-1000 ease-in-out
                        ${index === heroImageIndex ? 'opacity-100' : 'opacity-0'}`}
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
        </section>
  
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
            <button 
              onClick={() => setIsMenuOpen(false)} 
              className="absolute top-7 right-4 p-2"
            >
              <X size={28} />
            </button>
            <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="text-2xl font-bold text-gray-700 hover:text-[#8B0000] py-4">Início</a>
            <a href="#estoque" onClick={(e) => handleNavClick(e, '#estoque')} className="text-2xl font-bold text-gray-700 hover:text-[#8B0000] py-4">Estoque Real</a>
            <a href="#contato" onClick={(e) => handleNavClick(e, '#contato')} className="text-2xl font-bold text-gray-700 hover:text-[#8B0000] py-4">Falar no Zap</a>
          </div>
        )}
  
        <section id="estoque" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 border-b border-gray-200 pb-4">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900">Vitrine de Pronta Entrega</h3>
                <p className="text-gray-500 mt-1">Itens disponíveis agora em Salvador.</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-4 md:mt-0 w-full md:w-auto">
                {['all', 'natura', 'boticario', 'avon'].map(brand => (
                  <button 
                    key={brand}
                    onClick={() => setActiveBrand(brand)}
                    className={`px-5 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition capitalize
                      ${activeBrand === brand 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}
                  >
                    {brand === 'all' ? 'Todos' : brand}
                  </button>
                ))}
              </div>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  brandColors={brandColors}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </div>
        </section>
  
        <LogoSlider />
  
        <FeaturesSection />
  
        <footer id="contato" className="bg-white pt-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="cursor-pointer">
              <div className="text-center md:text-left">
                <h2 className="text-xl font-black text-gray-900">RED<span className="text-[#B22222]">VITORIA</span></h2>
                <p className="text-sm text-gray-500 mt-1">Sua loja de pronta entrega em Salvador.</p>
              </div>
            </a>
            <button 
              onClick={checkoutWhatsApp}
              className="bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition flex items-center gap-2 shadow-lg shadow-green-100 w-full md:w-auto justify-center"
            >
              <MessageCircle size={20} />
              Chamar no WhatsApp
            </button>
          </div>
          <div className="bg-red-100 text-center text-red-900 text-xs py-6 px-4">
            <p>&copy; {copyrightYear} RedVitoria. Revendedora oficial independente Avon, Natura e O Boticário. Entrega grátis válida apenas para Salvador/BA.</p>
          </div>
        </footer>
      </div>
    );
  };
  
  export default HomePage;