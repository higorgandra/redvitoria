import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { ShoppingBag, Send, Share2, Check } from 'lucide-react';
import { incrementMetric } from './firebase'; // 1. Importar a função

const ProductCard = ({ product, brandColors, onAddToCart, isHighlighted }) => {
  const [hasCopied, setHasCopied] = useState(false);

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

  // Função para registrar o clique no card de anúncio
  const handleAdClick = () => {
    incrementMetric('adCardClicks');
  };

  // Função para copiar o link e alterar o estado do botão
  const handleShareAndCopy = (e) => {
    e.stopPropagation(); // Impede que outros eventos de clique sejam acionados
    if (hasCopied) return; // Impede múltiplos cliques enquanto o "check" está visível
    
    // Gera uma URL com um parâmetro de consulta para o produto específico.
    const productUrl = `${window.location.origin}/produto/${product.id}`; 
    navigator.clipboard.writeText(productUrl).then(() => {
      setHasCopied(true);
      // Reseta o estado do botão após 2 segundos
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }).catch(err => {
      console.error('Falha ao copiar o link: ', err);
      // Opcional: mostrar uma mensagem de erro ao usuário
      setIsShareMenuOpen(false);
    });
  };

  // Novo critério de cor para a tag de desconto
  const getDiscountTagColor = (discountValue) => {
    if (discountValue >= 30) {
      return 'bg-red-600'; // Vermelho para descontos altos (urgência)
    }
    if (discountValue > 0) {
      return 'bg-green-700'; // Verde para descontos normais (oportunidade)
    }
    return 'bg-gray-500'; // Cor padrão caso algo dê errado
  };

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-500 ease-out group flex flex-col h-full
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${isHighlighted ? 'ring-4 ring-offset-2 ring-[#8B0000] shadow-2xl' : ''}`} // Lógica da animação e destaque
    >
      {/* Image Section */}
      <Link to={`/produto/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <div className="w-full h-full bg-gray-100">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
            />
          </div>
        </div>
      </Link>
        {/* Ícone de Compartilhar */}
        <div className="absolute top-3 right-3">
          <button 
            onClick={handleShareAndCopy}
            className={`backdrop-blur-sm p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100
              ${hasCopied 
                ? 'bg-green-500 text-white' 
                : 'bg-white/70 text-gray-800 hover:bg-white hover:text-[#8B0000]'}`} 
            title={hasCopied ? "Link copiado!" : "Copiar link do produto"}
          >
            {hasCopied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        </div>      

      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex-grow">
          <Link to={`/produto/${product.id}`} className="block">
            <h3 className="text-sm text-gray-500 capitalize mb-1">{product.brand}</h3>
            <h4 className={`font-semibold text-gray-800 text-base leading-tight mb-2 h-12 line-clamp-2 hover:text-[#8B0000] transition-colors ${isAd && 'text-blue-700'}`}>{product.name}</h4>
          </Link>
          
          {!isAd ? (
            /* Price for regular products */
            <div className="flex flex-col mb-3 min-h-[52px]">
              {discount > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  R$ {fullPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">
                  R$ {price.toFixed(2).replace('.', ',')}
                </span>
                {discount > 0 && (
                  <div className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${getDiscountTagColor(discount)}`}>-{discount}%</div>
                )}
              </div>
            </div>
          ) : (
            /* Placeholder for ad cards to maintain layout */
            <div className="flex flex-col mb-3 h-[52px] items-start justify-center">
              <p className="text-xs text-gray-400">Clique abaixo para visitar minha loja nacional e ver mais produtos via catálogo.</p>
            </div>
          )}
        </div>
        
        {isAd ? (
          <a 
            href={product.link}
            target="_blank"
            onClick={handleAdClick} // Adiciona o registro do clique
            rel="noopener noreferrer"
            className="w-full mt-auto bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 font-medium h-10 px-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm lowercase"
            title="Visitar Loja Natura"
          >
            <Send size={16} />
            ver catálogo
          </a>
        ) : (
          <button 
            onClick={handleAddToCartClick} // 3. Usar a nova função no botão
            className="w-full mt-auto bg-[#8B0000] text-white hover:bg-[#650000] font-bold h-10 px-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm lowercase shadow-lg shadow-[#B22222]/30"
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