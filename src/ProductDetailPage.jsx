import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft, Check, Loader2, Plus, Minus, ShieldCheck, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard'; // Para produtos relacionados

const ProductDetailPage = ({ cart, addToCart }) => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showNotification, setShowNotification] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "products", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const productData = { id: docSnap.id, ...docSnap.data() };
                    setProduct(productData);

                    // Buscar produtos relacionados (mesma marca, exceto o atual)
                    const relatedQuery = query(
                        collection(db, "products"),
                        where("brand", "==", productData.brand),
                        where("status", "==", "Ativo"),
                        orderBy("createdAt", "desc"),
                        limit(4) // Pega 4 para garantir que teremos 3 mesmo se o produto atual estiver na lista
                    );
                    const relatedSnapshot = await getDocs(relatedQuery);
                    const relatedList = relatedSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(p => p.id !== productData.id); // Exclui o produto atual
                    setRelatedProducts(relatedList.slice(0, 3)); // Garante no máximo 3
                } else {
                    console.log("Nenhum produto encontrado!");
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

    const formatPrice = (price) => {
        if (typeof price !== 'number') return 'R$ --';
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleQuantityChange = (amount) => {
        setQuantity(prev => Math.max(1, prev + amount));
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
    const discount = fullPrice > product.price ? Math.round(((fullPrice - product.price) / fullPrice) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Barra de Navegação Adicionada */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex justify-center items-center h-20">
                        {/* Logo Centralizado */}
                        <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2">
                            <Link to="/" className="flex items-center cursor-pointer">
                                <div className="text-center">
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                        <span className="text-[#8B0000]">RED</span>VITORIA
                                    </h1>
                                    <span className="hidden md:block text-[10px] font-bold text-gray-400 tracking-widest uppercase -mt-1">
                                        Pronta Entrega Salvador
                                    </span>
                                </div>
                            </Link>
                        </div>
                        {/* Ícone do Carrinho à Direita */}
                        <div className="absolute right-0 flex items-center">
                            <Link to="/carrinho" className="relative p-2 hover:bg-[#B22222]/10 rounded-full transition group">
                                <ShoppingBag className="text-gray-700 group-hover:text-[#8B0000] transition" />
                                {cartItemCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-[#B22222] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Notificação */}
            {showNotification && (
                <Link to="/carrinho" className="fixed top-24 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce flex items-center gap-2 cursor-pointer">
                    <Check size={20} />
                    Adicionado à sacola!
                </Link>
            )}

            <main className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm">
                    <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#8B0000] mb-8">
                        <ArrowLeft size={16} />
                        Voltar para a vitrine
                    </Link>

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
                                    <span className="font-semibold text-sm">Corra, últimas {product.stock} unidades disponíveis!</span>
                                </div>
                            )}
                            <div className="flex flex-col mb-6 border-b pb-6">
                                {discount > 0 && (
                                    <span className="text-base text-gray-400 line-through">
                                        {formatPrice(fullPrice)}
                                    </span>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl font-bold text-gray-900">
                                        {formatPrice(product.price)}
                                    </span>
                                    {discount > 0 && (
                                        <div className="text-white text-sm font-bold px-3 py-1 rounded-full bg-red-600">-{discount}%</div>
                                    )}
                                </div>
                            </div>

                            {/* Seletor de Quantidade */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Quantidade</label>
                                <div className="flex items-center border border-gray-200 rounded-lg w-fit">
                                    <button onClick={() => handleQuantityChange(-1)} className="p-3 text-gray-500 hover:text-black disabled:opacity-50" disabled={quantity <= 1}>
                                        <Minus size={16} />
                                    </button>
                                    <span className="px-6 font-bold text-lg">{quantity}</span>
                                    <button onClick={() => handleQuantityChange(1)} className="p-3 text-gray-500 hover:text-black">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleAddToCart}
                                className="w-full mt-auto bg-[#8B0000] text-white hover:bg-[#650000] font-bold h-14 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 text-base lowercase shadow-lg shadow-[#B22222]/30"
                            >
                                <ShoppingBag size={18} />
                                adicionar à sacola
                            </button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-700">
                                <ShieldCheck size={18} />
                                <span className="font-semibold">Compra segura e produto original.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção de Descrição e Detalhes */}
                <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm mt-8">
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex gap-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium ${activeTab === 'description' ? 'border-[#8B0000] text-[#8B0000]' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                            >
                                Descrição
                            </button>
                            <button
                                onClick={() => setActiveTab('howToUse')}
                                className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium ${activeTab === 'howToUse' ? 'border-[#8B0000] text-[#8B0000]' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                            >
                                Como Usar
                            </button>
                        </nav>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-600">
                        {activeTab === 'description' && (
                            product.description ? (
                                <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br />') }} />
                            ) : (
                                <p>Nenhuma descrição detalhada disponível para este produto.</p>
                            )
                        )}
                        {activeTab === 'howToUse' && (
                            product.howToUse ? (
                                <div dangerouslySetInnerHTML={{ __html: product.howToUse.replace(/\n/g, '<br />') }} />
                            ) : (
                                <p>Nenhuma instrução de uso disponível para este produto.</p>
                            )
                        )}
                    </div>
                </div>

                {/* Produtos Relacionados */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quem viu, viu também</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedProducts.map(related => (
                                <ProductCard 
                                    key={related.id}
                                    product={related}
                                    onAddToCart={addToCart}
                                    isHighlighted={false}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProductDetailPage;