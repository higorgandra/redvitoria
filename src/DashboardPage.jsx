import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, ChevronDown, Menu, LogOut } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from './useAuth'; // O hook useAuth pode ser removido se 'isAdmin' não for mais usado nesta página.
import DashboardHome from './DashboardHome'; // Importar o novo componente

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const location = useLocation();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Package size={20} />, label: 'Produtos', path: '/dashboard/produtos' },
    ];

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
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    // Efeito para fechar o dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

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

                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-100">
                                <img src="https://i.postimg.cc/RFWS3s7N/571330743-18534298507005557-1264770583319279576-n.jpg" alt="Admin" className="w-9 h-9 rounded-full" />
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-semibold text-gray-800">Vitória Mota</p>
                                    <p className="text-xs text-gray-500">Administradora</p>
                                </div>
                                <ChevronDown size={20} className={`hidden sm:block text-gray-500 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-100 animate-fade-in-down">
                                    <div className="p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
                                        >
                                            <LogOut size={16} />
                                            <span>Sair</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {location.pathname === '/dashboard' ? (
                    <DashboardHome />
                ) : (
                    <Outlet />
                )}
            </main>
        </div>
    );
};

export default DashboardPage;