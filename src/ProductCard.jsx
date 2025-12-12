import React, { useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Send, Share2, Check } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, increment } from 'firebase/firestore';

const ProductCard = ({ product, cart, brandColors, onAddToCart, isHighlighted, currentPage, showShareIcon }) => {
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

  // Verifica se o item está no carrinho e se a quantidade atingiu o estoque
  const itemInCart = cart.find(item => item.id === product.id);
  const quantityInCart = itemInCart ? itemInCart.quantity : 0;
  const isStockLimitReached = !isAd && product.stock > 0 && quantityInCart >= product.stock;
  // Verifica se o produto está sem estoque (além do status, verifica a quantidade)
  const isOutOfStock = !isAd && product.stock <= 0;

  // Função auxiliar para registrar métricas com segurança
  const registerMetric = async (metricName) => {
    try {
      const metricsRef = doc(db, 'metrics', 'userInteractions');
      await setDoc(metricsRef, { [metricName]: increment(1) }, { merge: true });
    } catch (error) {
      console.error("Erro ao registrar métrica:", error);
    }
  };

  // 2. Criar uma função que chama as duas ações
  const handleAddToCartClick = () => {
    onAddToCart(product); // Ação original: adiciona ao estado do carrinho
    registerMetric('addToCartClicks'); // Nova ação: registra o clique no Firebase
  };

  // Função para registrar o clique no card de anúncio
  const handleAdClick = () => {
    registerMetric('adCardClicks');
  };

  // Função para copiar o link e alterar o estado do botão
  const handleShareAndCopy = (e) => {
    e.stopPropagation(); // Impede que outros eventos de clique sejam acionados
    if (hasCopied) return; // Impede múltiplos cliques enquanto o "check" está visível
    
    // Usa o `product.link` se existir (slug/URL final). Caso contrário, fallback para a rota interna por id.
      const productUrl = product.link && product.link.trim()
        ? product.link
        : `${window.location.origin}/produto/${product.id}`;
    navigator.clipboard.writeText(productUrl).then(() => {
      setHasCopied(true);
      // Reseta o estado do botão após 2 segundos
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }).catch(err => {
      console.error('Falha ao copiar o link: ', err);
      // Opcional: mostrar uma mensagem de erro ao usuário
      // setIsShareMenuOpen não existe aqui — apenas logamos o erro
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

  // Decide qual estado de navegação passar para a página de detalhe.
  // Usamos captura em pointerdown para garantir o valor de scroll exato no momento do clique.
  const navigate = useNavigate();
  const pointerScrollRef = useRef(null);

  const handlePointerDown = () => {
    try {
      pointerScrollRef.current = window.scrollY;
    } catch (err) {
      pointerScrollRef.current = 0;
    }
  };

  const handleClickNavigate = (e) => {
    // Previna o comportamento padrão do Link e faça navegação programática
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const scrollPos = pointerScrollRef.current !== null ? pointerScrollRef.current : (typeof window !== 'undefined' ? window.scrollY : 0);
    const state = { page: currentPage || 1, scrollPosition: scrollPos };
    const rawLink = product.link && product.link.trim() ? product.link.trim() : null;

    // Adiciona logs para depuração do fluxo de navegação
    console.log('ProductCard: navigating', { id: product.id, slug: product.slug, link: rawLink, isAd });

    // Se for um anúncio, preferimos abrir o link (se existir) em nova aba e registrar clique.
    if (isAd) {
      if (rawLink) {
        try {
          const url = new URL(rawLink, window.location.href);
          console.log('ProductCard: ad -> opening external', url.href);
          window.open(url.href, '_blank', 'noopener');
          return;
        } catch (err) {
          // Se não for uma URL válida, cair para o fallback interno
          console.error('Erro ao interpretar product.link para anúncio:', err);
        }
      }
      // Sem link específico para anúncio, fallback para detalhe por id
      navigate(`/produto/${product.id}`, { state });
      return;
    }

    // Para produtos normais: se o link parecer interno (startsWith '/' ou contém '/produto/' ou mesma origem), navegar via router.
    if (rawLink) {
      // startsWith('/') => caminho interno
      if (rawLink.startsWith('/')) {
        navigate(rawLink, { state });
        console.log('ProductCard: internal path (startsWith /) ->', rawLink);
        return;
      }
      try {
        const url = new URL(rawLink, window.location.href);
        const path = url.pathname + url.search + url.hash;
        // Se a URL pertence ao mesmo origin ou contém '/produto/' no pathname, tratar como interna
        if (url.origin === window.location.origin || url.pathname.includes('/produto/')) {
          navigate(path, { state });
          console.log('ProductCard: internal url ->', path);
          return;
        }
        // Caso contrário, é externa — abrir em nova aba
        window.open(url.href, '_blank', 'noopener');
        console.log('ProductCard: external url ->', url.href);
        return;
      } catch (err) {
        console.error('Erro ao interpretar product.link, fallback para id:', err);
      }
    }

    // Fallback final: navegar para a rota interna por id
    navigate(`/produto/${product.id}`, { state });
  };

  // Clique no card quando for anúncio: abre o `product.link` em nova aba.
  const handleAdCardClick = (e) => {
    if (!isAd) return;
    // Se o clique ocorreu sobre uma âncora ou um botão, deixe o elemento cuidar do clique (evita duplicar aberturas)
    try {
      if (e && e.target && e.target.closest && e.target.closest('a, button')) {
        return;
      }
    } catch (err) {
      // ignore
    }

    handleAdClick();

    const rawLink = product.link && product.link.trim() ? product.link.trim() : null;
    if (rawLink) {
      try {
        const url = new URL(rawLink, window.location.href);
        window.open(url.href, '_blank', 'noopener');
        return;
      } catch (err) {
        console.error('Erro ao interpretar product.link para anúncio (card):', err);
      }
    }

    // Fallback: navegar para detalhe interno se não houver link
    const scrollPos = pointerScrollRef.current !== null ? pointerScrollRef.current : (typeof window !== 'undefined' ? window.scrollY : 0);
    const state = { page: currentPage || 1, scrollPosition: scrollPos };
    navigate(`/produto/${product.id}`, { state });
  };

  return (
    <div
      ref={ref}
      onClick={isAd ? handleAdCardClick : null}
      onPointerDown={isAd ? handlePointerDown : null}
      onTouchStart={isAd ? handlePointerDown : null}
      onKeyDown={isAd ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAdCardClick(e); } } : null}
      role={isAd ? 'button' : null}
      tabIndex={isAd ? 0 : null}
      aria-label={isAd ? `Abrir anúncio: ${product.name}` : null}
      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-500 ease-out group flex flex-col h-full
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${isHighlighted ? 'ring-4 ring-offset-2 ring-[#8B0000] shadow-2xl' : ''}
        ${isAd ? ' cursor-pointer' : ''}`} // Lógica da animação e destaque
    >
      {/* Image Section */}
      <a
        href={product.link && product.link.trim() ? product.link : `/produto/${product.id}`}
        className="block"
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onClick={handleClickNavigate}
      >
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <div className="w-full h-full bg-gray-100">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
            />
          </div>
        </div>
      </a>
        {/* Ícone de Compartilhar (renderizado condicionalmente) */}
        {showShareIcon && (
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
        )}

      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex-grow">
          <a
            href={product.link && product.link.trim() ? product.link : `/produto/${product.id}`}
            onClick={handleClickNavigate}
            onPointerDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            className="block"
          >
            <h3 className="text-sm text-gray-500 capitalize mb-1">{product.brand}</h3>
            <h4 
              className={`font-semibold text-gray-800 text-base leading-tight mb-2 h-12 hover:text-[#8B0000] transition-colors ${isAd && 'text-blue-700'}`}
              title={product.name}
            >
              {product.name.length > 17 && !isAd
                ? `${product.name.substring(0, 17)}...`
                : product.name}
            </h4>
          </a>
          
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
            className="w-full mt-auto bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 font-medium h-10 px-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm"
            title="Visitar Loja Natura"
          >
            <Send size={16} />
            Catálogo
          </a>
        ) : (
          <button 
            onClick={handleAddToCartClick}
            disabled={isStockLimitReached || isOutOfStock}
            className={`w-full mt-auto font-bold h-10 px-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm lowercase shadow-lg
              ${isStockLimitReached 
                ? 'bg-gray-200 text-gray-500 cursor-default shadow-none' 
                : isOutOfStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#8B0000] text-white hover:bg-[#650000] shadow-[#B22222]/30'
              }`}
            title={isStockLimitReached ? "Produto já está no carrinho" : isOutOfStock ? "Produto sem estoque" : "Adicionar ao carrinho"}
          >
            {isStockLimitReached ? <Check size={16} /> : <ShoppingBag size={16} />}
            {isStockLimitReached 
              ? 'no carrinho' 
              : isOutOfStock 
                ? 'esgotado' 
                : 'carrinho'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;