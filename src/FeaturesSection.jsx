import React, { useState } from 'react';
import { Package, MapPin, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: <Package size={32} />,
    title: 'Estoque Real',
    description: 'Nada de encomendar e esperar 15 dias. Se está no site, está na minha mão pronto para sair.',
    color: 'text-green-400',
  },
  {
    icon: <MapPin size={32} />,
    title: 'Entrega Grátis SSA',
    description: 'Mora em Salvador? A entrega é por minha conta. Combinamos o melhor delivery.',
    color: 'text-green-400',
    highlight: true,
  },
  {
    icon: <Star size={32} />,
    title: 'Produtos Originais',
    description: 'Revendedora autorizada. Todos os produtos vão lacrados e com garantia de originalidade.',
    color: 'text-green-400',
  },
];

const FeaturesSection = () => {
  // O card do meio (índice 1) é o padrão
  const [activeIndex, setActiveIndex] = useState(1);

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? features.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex === features.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <section className="bg-gray-900 text-white py-16 border-t-4 border-[#8B0000]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Layout Desktop: Grid com 3 colunas */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className={`flex items-start gap-4 p-4 ${feature.highlight ? 'bg-gray-800/50 rounded-xl border border-gray-700' : ''}`}>
              <div className={`bg-gray-800 p-3 rounded-lg ${feature.color} shrink-0`}>{feature.icon}</div>
              <div>
                <h3 className={`text-lg font-bold mb-2 ${feature.color}`}>{feature.title}</h3>
                <p className={`${feature.highlight ? 'text-gray-300' : 'text-gray-400'} text-sm`}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Layout Mobile: Carrossel com setas */}
        <div className="md:hidden relative flex items-center justify-center">
          <button onClick={handlePrev} className="absolute left-0 bg-gray-800/50 p-2 rounded-full z-10">
            <ChevronLeft size={24} />
          </button>

          <div className="w-full overflow-hidden">
            <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
              {features.map((feature, index) => (
                <div key={index} className="w-full flex-shrink-0 px-8">
                  <div className="flex flex-col items-center text-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className={`bg-gray-800 p-3 rounded-lg ${feature.color}`}>{feature.icon}</div>
                    <div>
                      <h3 className={`text-lg font-bold mb-2 ${feature.color}`}>{feature.title}</h3>
                      <p className="text-gray-300 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleNext} className="absolute right-0 bg-gray-800/50 p-2 rounded-full z-10">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;