import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { incrementMetric } from './firebase'; // 1. Importar a função

// Componente para o ícone personalizado do WhatsApp
const WhatsAppIcon = ({ size = 24 }) => (
  <svg fill="currentColor" width={size} height={size} viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <title>whatsapp</title>
    <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z" />
  </svg>
);

const CartPage = ({ cart, updateQuantity, removeFromCart, clearCart }) => {
  const [customerName, setCustomerName] = useState(''); // Estado para o nome do cliente
  const [paymentMethod, setPaymentMethod] = useState('pix'); // Estado para a forma de pagamento

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
    let message = `Olá! Meu nome é *${customerName.trim()}* e tenho interesse nos seguintes produtos:\n\n`;
    cart.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (${item.brand}) - ${formatPrice(item.price)} cada\n`;
    });
    message += `\n*Forma de Pagamento: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}*\n*Total do Pedido: ${formatPrice(total)}*`;
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
                          <button 
                            onClick={() => updateQuantity(item.id, 1)} 
                            className="p-2 text-gray-500 hover:text-black disabled:opacity-50"
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="font-medium text-red-600 hover:text-red-800 flex items-center gap-1">
                          <Trash2 size={16} /> Remover
                        </button>
                      </div>
                      {item.quantity >= item.stock && (
                        <p className="text-xs text-red-600 mt-2">Limite de estoque atingido.</p>
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
              <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
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
                {/* Campo de Nome do Cliente */}
                <div className="mt-6 pt-4 border-t">
                  <label htmlFor="customerName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Seu nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    placeholder="Digite seu nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50"
                  />
                </div>
                {/* Campo de Forma de Pagamento */}
                <div className="mt-4">
                  <label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700 mb-2 block">
                    Forma de pagamento
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#8B0000]/50"
                    disabled // Desabilitado pois só há uma opção
                  >
                    <option value="pix">Pix</option>
                  </select>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 mt-4 pt-4 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <button 
                  onClick={checkoutWhatsApp}
                  disabled={!customerName.trim() || !paymentMethod}
                  className={`w-full mt-6 px-6 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${customerName.trim() && paymentMethod ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  <WhatsAppIcon size={20} />
                  {customerName.trim() ? 'Finalizar no WhatsApp' : 'Digite seu nome'}
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