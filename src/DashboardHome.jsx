import React from 'react';
import { ShoppingCart, Package, Users, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

const StatCard = ({ icon, title, value, change, changeType }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="bg-gray-100 p-3 rounded-lg text-gray-600">
                {icon}
            </div>
            <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={20} />
            </button>
        </div>
        <div>
            <p className="text-sm text-gray-500 mt-4">{title}</p>
            <div className="flex items-end justify-between mt-1">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <div className={`flex items-center text-sm font-semibold ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                    {changeType === 'increase' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{change}</span>
                </div>
            </div>
        </div>
    </div>
);

const DashboardHome = () => {
    const orders = [
        { id: '#876364', name: 'João Silva', date: '12/06/2024', total: 'R$ 199,90', status: 'Pendente', statusColor: 'bg-yellow-100 text-yellow-800' },
        { id: '#876365', name: 'Maria Oliveira', date: '12/06/2024', total: 'R$ 89,90', status: 'Entregue', statusColor: 'bg-green-100 text-green-800' },
        { id: '#876366', name: 'Carlos Souza', date: '11/06/2024', total: 'R$ 285,80', status: 'Entregue', statusColor: 'bg-green-100 text-green-800' },
        { id: '#876367', name: 'Ana Pereira', date: '11/06/2024', total: 'R$ 45,90', status: 'Cancelado', statusColor: 'bg-red-100 text-red-800' },
        { id: '#876368', name: 'Lucas Costa', date: '10/06/2024', total: 'R$ 39,90', status: 'Entregue', statusColor: 'bg-green-100 text-green-800' },
    ];

    return (
        <div className="p-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    icon={<ShoppingCart size={24} />}
                    title="Vendas Totais (Mês)"
                    value="R$ 7.845"
                    change="+12.5%"
                    changeType="increase"
                />
                <StatCard
                    icon={<Package size={24} />}
                    title="Pedidos Novos"
                    value="32"
                    change="-2.1%"
                    changeType="decrease"
                />
                <StatCard
                    icon={<Users size={24} />}
                    title="Novos Clientes"
                    value="18"
                    change="+5.4%"
                    changeType="increase"
                />
                <StatCard
                    icon={<ArrowUpRight size={24} />}
                    title="Taxa de Conversão"
                    value="2.45%"
                    change="+0.2%"
                    changeType="increase"
                />
            </div>

            {/* Recent Orders */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Pedidos Recentes</h3>
                    <a href="#" className="text-sm font-semibold text-[#8B0000] hover:underline">Ver Todos</a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-t-lg">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID do Pedido</th>
                                <th scope="col" className="px-6 py-3">Cliente</th>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Total</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{order.id}</td>
                                    <td className="px-6 py-4">{order.name}</td>
                                    <td className="px-6 py-4">{order.date}</td>
                                    <td className="px-6 py-4">{order.total}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.statusColor}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="font-medium text-[#8B0000] hover:underline">Detalhes</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;