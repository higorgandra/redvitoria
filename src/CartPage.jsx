import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, MessageCircle } from 'lucide-react';
import { incrementMetric } from './firebase'; // 1. Importar a função

const CartPage = ({ cart, updateQuantity, removeFromCart, clearCart }) => {

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalDiscount = cart.reduce((acc, item) => {
    // Garante que fullPrice seja um número, usando o dobro do preço como fallback.
    const fullPrice = typeof item.fullPrice === 'number' && item.fullPrice > 0 ? item.fullPrice : item.price * 2;
    const itemDiscount = (fullPrice - item.price) * item.quantity;
    // Soma apenas se o desconto for positivo
    return acc + (itemDiscount > 0 ? itemDiscount : 0);
  }, 0);

  const totalFullPrice = cart.reduce((acc, item) => {
    // Usa a mesma lógica de fallback para consistência
    const fullPrice = typeof item.fullPrice === 'number' && item.fullPrice > 0 ? item.fullPrice : item.price * 2;
    return acc + fullPrice * item.quantity;
  }, 0);

  const total = subtotal; // Assumindo frete grátis por enquanto
  const phone = "5571992293834"; // Número de telefone centralizado

  const checkoutWhatsApp = () => {
    if (cart.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    let message = "Olá! Tenho interesse nos seguintes produtos:\n\n";
    cart.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (${item.brand}) - ${formatPrice(item.price)} cada\n`;
    });
    message += `\n*Total do Pedido: ${formatPrice(total)}*`;
    message += `\n\nAguardo para combinar a entrega.`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    // 2. Registrar o clique no Firebase
    incrementMetric('whatsappClicks');
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Simples */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center cursor-pointer">
              <div className="bg-[#8B0000] text-white p-2 rounded-lg mr-2 transform -rotate-3">
                <ShoppingBag size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  RED<span className="text-[#8B0000]">VITORIA</span>
                </h1>
              </div>
            </Link>
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#8B0000]">
              <ArrowLeft size={16} />
              Continuar Comprando
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Meu Carrinho</h2>
        
        {cart.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">Seu carrinho está vazio</h3>
            <p className="text-gray-500 mt-2 mb-6">Adicione produtos da nossa vitrine para vê-los aqui.</p>
            <Link to="/" className="bg-[#8B0000] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#650000] transition">
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Itens do Carrinho */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
              <ul className="divide-y divide-gray-200">
                {cart.map(item => (
                  <li key={item.id} className="flex py-6 items-center">
                    <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-md" />
                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.name}</h3>
                          <p className="ml-4">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 capitalize">{item.brand}</p>
                      </div>
                      <div className="flex-1 flex items-center justify-between text-sm mt-4">
                        <div className="flex items-center border border-gray-200 rounded-md">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-gray-500 hover:text-black disabled:opacity-50" disabled={item.quantity <= 1}>
                            <Minus size={16} />
                          </button>
                          <span className="px-4 font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-gray-500 hover:text-black">
                            <Plus size={16} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="font-medium text-red-600 hover:text-red-800 flex items-center gap-1">
                          <Trash2 size={16} /> Remover
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t pt-4">
                <button onClick={clearCart} className="text-sm font-medium text-gray-500 hover:text-red-600">
                  Limpar carrinho
                </button>
              </div>
            </div>

            {/* Resumo do Pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm sticky top-28">
                <h3 className="text-lg font-semibold border-b pb-4 mb-4">Resumo do Pedido</h3>
                <div className="space-y-2">
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Valor cheio</span>
                      <span>{formatPrice(totalFullPrice)}</span>
                    </div>
                  )}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium">Descontos</span>
                      <span className="font-medium">-{formatPrice(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Entrega</span>
                    <span className="font-medium text-green-600">Grátis</span>
                  </div>
                </div>
                {/* Campo de Cupom de Desconto */}
                <div className="mt-6 pt-4 border-t border-dashed">
                  <label htmlFor="coupon" className="text-sm font-medium text-gray-700 mb-2 block">
                    Cupom de desconto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="coupon"
                      name="coupon"
                      placeholder="Insira seu cupom"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50"
                    />
                    <button type="button" className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors">Aplicar</button>
                  </div>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 mt-4 pt-4 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <button 
                  onClick={checkoutWhatsApp}
                  className="w-full mt-6 bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  Finalizar no WhatsApp
                </button>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Você será redirecionado para o WhatsApp para combinar a entrega.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;