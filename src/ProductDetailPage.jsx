import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft, Check, Loader2, Plus, Minus, ShieldCheck, AlertTriangle, Package, Share2 } from 'lucide-react';
import ProductCard from './ProductCard'; // Para produtos relacionados
import Header from '/Header.jsx'; // Importar o novo Header

const ProductDetailPage = ({ cart, addToCart }) => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showNotification, setShowNotification] = useState(false);
    const [shareFeedback, setShareFeedback] = useState('Compartilhar este produto');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "products", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const productData = { id: docSnap.id, ...docSnap.data() };
                    setProduct(productData);

                    // CORREÇÃO: Simplificando a query para evitar o erro de índice do Firebase.
                    // Buscamos mais itens e filtramos no lado do cliente.
                    const relatedQuery = query(
                        collection(db, "products"),
                        where("brand", "==", productData.brand),
                        limit(10) // Pega mais itens para ter margem para filtrar
                    );
                    const relatedSnapshot = await getDocs(relatedQuery);
                    const relatedList = relatedSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(p => p.id !== productData.id && p.status === 'Ativo'); // Exclui o produto atual e filtra por status 'Ativo'
                    setRelatedProducts(relatedList.slice(0, 4)); // Garante no máximo 4
                } else {
                    // Produto não encontrado, poderia redirecionar para uma página 404.
                    // Opcional: redirecionar para uma página 404
                }
            } catch (error) {
                console.error("Erro ao buscar produto:", error);
            }
            setLoading(false);
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const handleAddToCart = () => {
        addToCart(product, quantity); // Passa a quantidade para a função
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const handleShare = async () => {
        // Garante que a função só execute se o produto já estiver carregado.
        if (!product) return;

        const shareData = {
            title: product.name,
            text: `Confira este produto na RedVitoria: ${product.name}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Erro ao usar a Web Share API:', error);
            }
        } else {
            // Fallback para navegadores que não suportam a Web Share API
            try {
                await navigator.clipboard.writeText(window.location.href);
                setShareFeedback('Link copiado!');
                setTimeout(() => setShareFeedback('Compartilhar este produto'), 2000);
            } catch (error) {
                console.error('Erro ao copiar o link:', error);
            }
        }
    };

    const formatPrice = (price) => {
        if (typeof price !== 'number') return 'R$ --';
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleQuantityChange = (amount) => {
        setQuantity(prev => {
            const newQuantity = prev + amount;
            // Garante que a quantidade não seja menor que 1 e nem maior que o estoque disponível.
            return Math.max(1, Math.min(newQuantity, product.stock));
        });
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin text-[#8B0000]" size={48} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Produto não encontrado</h2>
                <Link to="/" className="text-[#8B0000] hover:underline mt-4 inline-block">Voltar para a loja</Link>
            </div>
        );
    }

    const fullPrice = product.fullPrice || product.price * 2;
    const discountPercentage = fullPrice > product.price ? Math.round(((fullPrice - product.price) / fullPrice) * 100) : 0;

    // Lógica para desabilitar o botão "Adicionar à Sacola"
    const itemInCart = cart.find(item => item.id === product.id);
    const quantityInCart = itemInCart ? itemInCart.quantity : 0;
    const isOutOfStock = product.stock <= 0;
    // Verifica se a quantidade no carrinho já atingiu o limite do estoque
    const isStockLimitReached = product.stock > 0 && quantityInCart >= product.stock;
    // Condição final para desabilitar os botões
    const isAddToCartDisabled = isOutOfStock || isStockLimitReached;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Barra de Navegação Adicionada */}
            <Header cart={cart} />

            {/* Notificação */}
            {showNotification && (
                <Link to="/carrinho" className="fixed bottom-20 inset-x-4 md:top-28 md:bottom-auto md:inset-x-auto md:right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center justify-center md:justify-start gap-2 cursor-pointer animate-fade-in-up">
                    <Check size={20} />
                    Adicionado à sacola!
                </Link>
            )}

            <main className="max-w-5xl mx-auto p-4 md:p-8 pb-28 md:pb-8">
                <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm">
                    <button
                        onClick={() => {
                            const originScroll = location.state?.scrollPosition ?? null;
                            const originPage = location.state?.page ?? null;
                            if (originPage !== null || originScroll !== null) {
                                // Navega explicitamente para /?page=X e também passa o state
                                const pageQuery = originPage ?? 1;
                                navigate(`/?page=${pageQuery}`, { state: { scrollPosition: originScroll ?? 0, page: pageQuery } });
                            } else {
                                // Fallback: volta no histórico
                                navigate(-1);
                            }
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#8B0000] mb-8"
                    >
                        <ArrowLeft size={16} />
                        Voltar para a vitrine
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {/* Coluna da Imagem */}
                        <div className="bg-gray-100 rounded-lg flex items-center justify-center p-4 aspect-square relative">
                            <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
                            {product.sku && (
                                <span className="absolute bottom-2 left-2 bg-black/40 text-white text-xs font-mono px-2 py-1 rounded">
                                    Cod: {product.sku}
                                </span>
                            )}
                        </div>

                        {/* Coluna de Detalhes e Ações */}
                        <div className="flex flex-col">
                            <h3 className="text-sm text-gray-500 capitalize mb-2">{product.brand}</h3>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

                            {product.stock > 0 && product.stock <= 5 && (
                                <div className="mb-4 flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                    <AlertTriangle size={20} />
                                    <span className="font-semibold text-sm">
                                        {product.stock === 1
                                            ? "Corra, última unidade disponível!"
                                            : `Corra, últimas ${product.stock} unidades disponíveis!`}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col mb-6 border-b pb-6">
                                {discountPercentage > 0 && (
                                    <span className={`text-base text-gray-400 line-through transition-opacity duration-300 ${quantity > 1 ? 'opacity-100' : 'opacity-100'}`}>
                                        {formatPrice(fullPrice * quantity)}
                                    </span>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl font-bold text-gray-900 transition-colors duration-300">
                                        {formatPrice(product.price * quantity)}
                                    </span>
                                    {discountPercentage > 0 && (
                                        <div className="text-white text-sm font-bold px-3 py-1 rounded-full bg-red-600">-{discountPercentage}%</div>
                                    )}
                                </div>
                            </div>

                            {/* Seletor de Quantidade */}
                            <div className="flex flex-wrap items-end gap-4 mb-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Quantidade</label>
                                    <div className="flex items-center border border-gray-200 rounded-lg w-fit bg-white">
                                        <button onClick={() => handleQuantityChange(-1)} className="p-3 text-gray-500 hover:text-black disabled:opacity-50" disabled={quantity <= 1}>
                                            <Minus size={16} />
                                        </button>
                                        <span className="px-6 font-bold text-lg tabular-nums">{quantity}</span>
                                        <button onClick={() => handleQuantityChange(1)} className="p-3 text-gray-500 hover:text-black disabled:opacity-50" disabled={quantity >= product.stock}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                                {product.stock > 0 && (
                                    <div className="bg-green-50 p-2 rounded-lg border border-green-200 flex items-center gap-2">
                                        <div className="bg-green-100 p-1 rounded-full text-green-700">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                                            <p className="text-sm font-bold text-green-800">Em Estoque</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Botão para Desktop */}
                            <button 
                                onClick={handleAddToCart}
                                disabled={isAddToCartDisabled}
                                className={`w-full mt-auto font-bold h-14 px-4 rounded-lg transition-colors duration-300 hidden md:flex items-center justify-center gap-2 text-base lowercase shadow-lg
                                    ${isAddToCartDisabled
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-[#8B0000] text-white hover:bg-[#650000] shadow-[#B22222]/30'
                                    }`}
                            >
                                {isStockLimitReached ? <Check size={18} /> : <ShoppingBag size={18} />}
                                {isOutOfStock 
                                    ? 'esgotado' 
                                    : isStockLimitReached 
                                        ? 'limite no carrinho' 
                                        : 'adicionar à sacola'
                                }
                            </button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-700">
                                <ShieldCheck size={18} />
                                <span className="font-semibold">Compra segura e produto original.</span>
                            </div>

                            {/* Botão de Compartilhar */}
                            <div className="mt-6 text-center">
                                <button
                                    onClick={handleShare}
                                    className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-[#8B0000] transition-colors w-full py-2 rounded-lg hover:bg-gray-100"
                                >
                                    {shareFeedback === 'Link copiado!' ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                                    {shareFeedback}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção de Descrição e Detalhes */}
                <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Descrição do Produto
                    </h2>
                    <div className="prose prose-sm max-w-none text-gray-600">
                        {product.description ? (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: product.description.replace(/\n/g, '<br />'),
                                }}
                            />
                        ) : (
                            <p>Nenhuma descrição detalhada disponível para este produto.</p>
                        )}
                    </div>
                </div>

                {/* Produtos Relacionados */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quem viu, viu também</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {relatedProducts.map(related => (
                                <ProductCard 
                                    key={related.id}
                                    product={related}
                                    cart={cart}
                                    onAddToCart={addToCart}
                                    isHighlighted={false}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Barra de Ação Fixa para Mobile */}
            <button
                onClick={handleAddToCart}
                disabled={isAddToCartDisabled}
                className={`md:hidden fixed bottom-0 left-0 right-0 w-full font-bold h-16 px-4 transition-colors duration-300 flex items-center justify-center gap-2 text-base lowercase shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-30
                    ${isAddToCartDisabled
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#8B0000] text-white hover:bg-[#650000]'
                    }`}
            >
                {isStockLimitReached ? <Check size={18} /> : <ShoppingBag size={18} />}
                {isOutOfStock 
                    ? 'esgotado' 
                    : isStockLimitReached 
                        ? 'limite no carrinho' 
                        : 'adicionar à sacola'
                }
            </button>
        </div>
    );
};

export default ProductDetailPage;