import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

// Componente do ícone do Instagram em SVG
const InstagramIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const Header = ({ cart }) => {
    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-center h-20">
                    {/* Ícone de Links */}
                    <div className="absolute left-0">
                        <Link to="/social" className="relative p-2 hover:bg-[#B22222]/10 rounded-full transition group">
                            <InstagramIcon className="text-gray-700 group-hover:text-[#8B0000] transition" />
                        </Link>
                    </div>

                    {/* Logo */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <a href="/" className="flex items-center">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                <span className="text-[#8B0000]">VITÓRIA</span>
                            </h1>
                        </a>
                    </div>

                    {/* Ícone do Carrinho */}
                    <div className="absolute right-0 flex items-center">
                        <Link to="/carrinho" className="relative p-2 hover:bg-[#B22222]/10 rounded-full transition group">
                            <ShoppingBag className="text-gray-700 group-hover:text-[#8B0000] transition" />
                            {cartItemCount > 0 && (
                                <span className="absolute top-0 right-0 bg-[#B22222] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold transform -translate-y-1/2 translate-x-1/2 animate-float">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;