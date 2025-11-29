import React from 'react';
import { useInView } from 'react-intersection-observer';
import { ShoppingBag, Check } from 'lucide-react';

const ProductCard = ({ product, brandColors, onAddToCart }) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // A animação acontece apenas uma vez
    threshold: 0.1,    // O card é considerado visível quando 10% dele está na tela
  });

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-700 ease-out border border-gray-100 group overflow-hidden flex flex-col
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} // Lógica da animação
    >
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
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 line-through">
              R$ {(product.price * 2).toFixed(2).replace('.', ',')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="bg-[#B22222] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                -50%
              </span>
            </div>
          </div>
          <button 
            onClick={() => onAddToCart(product)}
            className="bg-gray-900 text-white p-3 rounded-lg hover:bg-[#650000] transition shadow-md group-hover:shadow-lg"
            title="Adicionar à sacola"
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;