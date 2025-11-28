import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Star, Truck, MessageCircle, MapPin, Check, Package } from 'lucide-react';

// Dados simulados dos produtos (Foco: Pronta Entrega)
const productsData = [
  {
    id: 1,
    name: "Malbec Desodorante Colônia",
    brand: "boticario",
    price: 199.90,
    image: "https://images.unsplash.com/photo-1595345763073-2a382be55660?auto=format&fit=crop&q=80&w=600",
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
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=600",
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

const App = () => {
  const [activeBrand, setActiveBrand] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  // Filtra produtos
  const filteredProducts = activeBrand === 'all' 
    ? productsData 
    : productsData.filter(p => p.brand === activeBrand);

  // Adicionar ao carrinho
  const addToCart = (product) => {
    setCart([...cart, product]);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Gerar link do WhatsApp com o pedido
  const checkoutWhatsApp = () => {
    let message = "Olá RedVitoria! Gostaria de reservar os itens da Pronta Entrega:\n\n";
    cart.forEach(item => {
      message += `- ${item.name} (${item.brand}): R$ ${item.price.toFixed(2)}\n`;
    });
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    message += `\nTotal: R$ ${total.toFixed(2)}`;
    message += `\n\nSou de Salvador e gostaria de combinar a entrega grátis!`;
    
    // Substitua pelo seu número real
    const phone = "5571999999999"; // DDD 71 para Salvador
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Notificação Flutuante */}
      {showNotification && (
        <div className="fixed top-24 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce flex items-center gap-2">
          <Check size={20} />
          Adicionado à sacola!
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="bg-red-600 text-white p-2 rounded-lg mr-2 transform -rotate-3">
                <ShoppingBag size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  RED<span className="text-red-600">VITORIA</span>
                </h1>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block -mt-1">
                  Pronta Entrega Multimarca
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#home" className="hover:text-red-600 transition font-medium">Início</a>
              <a href="#estoque" className="hover:text-red-600 transition font-medium">Estoque Real</a>
              <a href="#contato" className="hover:text-red-600 transition font-medium">Falar no Zap</a>
              
              <button 
                onClick={checkoutWhatsApp}
                className="relative p-2 hover:bg-red-50 rounded-full transition group"
              >
                <ShoppingBag className="text-gray-700 group-hover:text-red-600 transition" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <button 
                onClick={checkoutWhatsApp}
                className="relative p-2"
              >
                <ShoppingBag className="text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg">
            <a href="#home" className="block text-gray-600 hover:text-red-600 font-medium" onClick={() => setIsMenuOpen(false)}>Início</a>
            <a href="#estoque" className="block text-gray-600 hover:text-red-600 font-medium" onClick={() => setIsMenuOpen(false)}>Estoque Real</a>
            <a href="#contato" className="block text-gray-600 hover:text-red-600 font-medium" onClick={() => setIsMenuOpen(false)}>Combinar Entrega</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative bg-white py-16 lg:py-24 overflow-hidden border-b border-gray-100">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-50/50 skew-x-12 transform translate-x-20"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-6">
              <MapPin size={14} />
              Exclusivo para Salvador
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Sem espera. <br />
              <span className="text-red-600">Comprou, chegou.</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
              Esqueça os prazos longos de catálogo. Aqui na <strong>RedVitoria</strong>, todos os produtos já estão comigo. Pediu hoje, recebe rápido.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#estoque" className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-200 text-center">
                Ver Disponíveis Agora
              </a>
              <div className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                <Truck className="text-green-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Entrega Grátis <br/> <span className="text-xs font-normal text-gray-500">Apenas Salvador/BA</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 flex justify-center relative">
            <div className="relative">
              <div className="absolute -inset-4 bg-red-600/10 rounded-full blur-xl animate-pulse"></div>
              <img 
                src="https://images.unsplash.com/photo-1555529771-7888783a18d3?auto=format&fit=crop&q=80&w=600" 
                alt="Produtos Pronta Entrega" 
                className="relative rounded-2xl shadow-2xl object-cover w-72 h-72 md:w-96 md:h-96 border-4 border-white rotate-3"
              />
              {/* Badge Flutuante */}
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

      {/* Brands Selection */}
      <section id="estoque" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Vitrine de Pronta Entrega</h3>
              <p className="text-gray-500 mt-1">Itens disponíveis agora em Salvador.</p>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {['all', 'natura', 'boticario', 'avon'].map(brand => (
                <button 
                  key={brand}
                  onClick={() => setActiveBrand(brand)}
                  className={`px-5 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition capitalize
                    ${activeBrand === brand 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}
                >
                  {brand === 'all' ? 'Ver Tudo' : brand}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group overflow-hidden flex flex-col">
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <span className={`absolute top-3 left-3 text-[10px] font-bold text-white px-2 py-1 rounded shadow-sm z-10 uppercase tracking-wide ${brandColors[product.brand]}`}>
                    {product.brand}
                  </span>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-green-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 z-10 shadow-sm">
                    <Check size={10} strokeWidth={4} />
                    SALVADOR
                  </div>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{product.name}</h3>
                  <p className="text-gray-500 text-xs mb-4 flex-1">{product.description}</p>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                    <div>
                      <span className="block text-xs text-gray-400 font-medium">À vista</span>
                      <span className="text-xl font-bold text-gray-900">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-gray-900 text-white p-3 rounded-lg hover:bg-red-600 transition shadow-md group-hover:shadow-lg"
                      title="Adicionar à sacola"
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose RedVitoria */}
      <section className="bg-gray-900 text-white py-16 border-t-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-4">
              <div className="bg-gray-800 p-3 rounded-lg text-red-500 shrink-0">
                <Package size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Estoque Real</h3>
                <p className="text-gray-400 text-sm">Nada de encomendar e esperar 15 dias. Se está no site, está na minha mão pronto para sair.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="bg-gray-800 p-3 rounded-lg text-green-400 shrink-0">
                <MapPin size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 text-green-400">Entrega Grátis SSA</h3>
                <p className="text-gray-300 text-sm">Mora em Salvador? A entrega é por minha conta. Combinamos o melhor local ou delivery.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4">
              <div className="bg-gray-800 p-3 rounded-lg text-red-500 shrink-0">
                <Star size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Produtos Originais</h3>
                <p className="text-gray-400 text-sm">Revendedor autorizado. Todos os produtos vão lacrados e com garantia de originalidade.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-white pt-12 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-gray-900">RED<span className="text-red-600">VITORIA</span></h2>
            <p className="text-sm text-gray-500 mt-1">Sua loja de pronta entrega em Salvador.</p>
          </div>
          <button 
            onClick={checkoutWhatsApp}
            className="bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition flex items-center gap-2 shadow-lg shadow-green-100 w-full md:w-auto justify-center"
          >
            <MessageCircle size={20} />
            Chamar no WhatsApp
          </button>
        </div>
        <div className="text-center text-gray-400 text-xs border-t border-gray-100 pt-8">
          <p>&copy; 2024 RedVitoria. Revendedor independente Natura, Avon e O Boticário. Entrega grátis válida apenas para Salvador/BA.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;