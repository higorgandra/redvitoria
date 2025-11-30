import React from 'react';
import { useInView } from 'react-intersection-observer';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { incrementMetric } from './firebase'; // 1. Importar a função

const ProductCard = ({ product, brandColors, onAddToCart }) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // A animação acontece apenas uma vez
    threshold: 0.1,    // O card é considerado visível quando 10% dele está na tela
  });

  // Função para garantir que o preço seja sempre um número
  const getNumericPrice = (priceValue) => {
    if (typeof priceValue === 'number') {
      return priceValue;
    }
    if (typeof priceValue === 'string') {
      // Converte strings como "R$ 199,90" para o número 199.90
      const numericPrice = parseFloat(priceValue.replace('R$', '').replace('.', '').replace(',', '.').trim());
      return isNaN(numericPrice) ? 0 : numericPrice;
    }
    return 0; // Retorna 0 se o preço for inválido ou ausente
  };

  const price = getNumericPrice(product.price);
  const fullPrice = getNumericPrice(product.fullPrice || price * 2); // Usa fullPrice ou um valor calculado
  const discount = fullPrice > price ? Math.round(((fullPrice - price) / fullPrice) * 100) : 0;
  const isAd = product.status === 'Anúncio';

  // 2. Criar uma função que chama as duas ações
  const handleAddToCartClick = () => {
    onAddToCart(product); // Ação original: adiciona ao estado do carrinho
    incrementMetric('addToCartClicks'); // Nova ação: registra o clique no Firebase
  };

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-500 ease-out group flex flex-col h-full
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} // Lógica da animação
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        {discount > 0 && !isAd && (
          <div className={`absolute top-2 left-2 z-10 text-white text-xs font-bold px-2.5 py-1 rounded-full ${brandColors[product.brand] || 'bg-red-600'}`}>
            -{discount}%
          </div>
        )}
        <div className="w-full h-full bg-gray-100">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex-grow">
          <h3 className="text-sm text-gray-500 capitalize mb-1">{product.brand}</h3>
          <h4 className={`font-semibold text-gray-800 text-base leading-tight mb-2 h-12 line-clamp-2 ${isAd && 'text-blue-700'}`}>{product.name}</h4>
          
          {!isAd ? (
            /* Price for regular products */
            <div className="flex flex-col mb-3">
              {discount > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  R$ {fullPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
              <span className="text-xl font-bold text-gray-900">
                R$ {price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ) : (
            /* Placeholder for ad cards to maintain layout */
            <div className="flex flex-col mb-3 h-[52px] items-start justify-center">
              <p className="text-xs text-gray-400">Clique abaixo para visitar a loja oficial e ver mais produtos.</p>
            </div>
          )}
        </div>
        
        {isAd ? (
          <a 
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-auto bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 font-medium h-10 px-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm lowercase"
            title="Visitar Loja Natura"
          >
            <ExternalLink size={16} />
            visitar loja
          </a>
        ) : (
          <button 
            onClick={handleAddToCartClick} // 3. Usar a nova função no botão
            className="w-full mt-auto bg-transparent text-gray-800 border border-gray-800 hover:bg-gray-800 hover:text-white font-medium h-10 px-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm lowercase"
            title="adicionar à sacola"
          >
            <ShoppingBag size={16} />
            adicionar à sacola
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;