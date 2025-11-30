import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, Bell, ChevronDown, Search, Menu } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth'; // 1. Importar o hook

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const location = useLocation();
    const { isAdmin } = useAuth(); // 2. Usar o hook para verificar se é admin

    let menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <ShoppingCart size={20} />, label: 'Pedidos', path: '/dashboard/pedidos' },
        { icon: <Package size={20} />, label: 'Produtos', path: '/dashboard/produtos' },
        { icon: <Users size={20} />, label: 'Clientes', path: '/dashboard/clientes' },
        { icon: <Settings size={20} />, label: 'Configurações', path: '/dashboard/configuracoes' }
    ];

    // 3. Adicionar o item de menu condicionalmente
    if (isAdmin) {
        menuItems.splice(4, 0, { icon: <Users size={20} />, label: 'UPLOAD', path: '/dashboard/upload' });
    }

    return <>
        <div className={`fixed inset-y-0 left-0 bg-white w-64 p-6 z-30 transform transition-transform duration-300 ease-in-out border-r border-gray-100 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed`}>
            <div className="flex items-center mb-12">
                <div className="bg-[#8B0000] text-white p-2 rounded-lg mr-2 transform -rotate-3">
                    <LayoutDashboard size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">
                        RED<span className="text-[#8B0000]">VITORIA</span>
                    </h1>
                    <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase block -mt-1">
                        Painel Admin
                    </span>
                </div>
            </div>

            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                    <Link key={item.label} to={item.path} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-[#8B0000]/10 text-[#8B0000] font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                {/* Placeholder for future use */}
            </div>
        </div>
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-20 lg:hidden"></div>}
    </>;
};

const DashboardPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className="lg:pl-64">
                <header className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-600">
                                <Menu size={24} />
                            </button>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                <Search size={18} className="text-gray-400" />
                                <input type="text" placeholder="Buscar pedidos, produtos..." className="text-sm bg-transparent focus:outline-none" />
                            </div>

                            <button className="text-gray-500 hover:text-gray-800 relative">
                                <Bell size={22} />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <div className="flex items-center gap-3">
                                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Admin" className="w-10 h-10 rounded-full" />
                                <div className="hidden sm:block">
                                    <p className="text-sm font-semibold text-gray-800">Vitória</p>
                                    <p className="text-xs text-gray-500">Admin</p>
                                </div>
                                <button className="hidden sm:block text-gray-500 hover:text-gray-800">
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
};

export default DashboardPage;