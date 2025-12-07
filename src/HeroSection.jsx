import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Package } from 'lucide-react';

const HeroSection = ({ handleNavClick, products = [] }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Filtra os produtos para criar a lista de imagens do carrossel
    const carouselImages = products
        .filter(p => p.stock > 0 && p.image && p.status !== 'Anúncio')
        .map(p => ({ src: p.image, alt: p.name }));

    useEffect(() => {
        // Se não houver imagens, não faz nada
        if (carouselImages.length === 0) return;

        const interval = setInterval(() => {
            setCurrentImageIndex(prevIndex => (prevIndex + 1) % carouselImages.length);
        }, 3000); // Muda a imagem a cada 3 segundos

        return () => clearInterval(interval);
    }, [carouselImages.length]);

    return (
        <section id="home" className="relative bg-white flex items-center justify-center pt-16 pb-8 md:py-24 overflow-hidden border-b border-gray-100">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#B22222]/10 skew-x-12 transform translate-x-20 hidden md:block"></div>
            <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
                {/* Mobile View */}
                <div className="flex flex-col items-center justify-center text-center md:hidden">
                    <div className="w-full">
                        <div className="mb-8 flex w-full justify-center relative h-64">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-[#B22222]/20 rounded-full blur-xl"></div>
                                <div className="relative w-64 h-64">
                                    {carouselImages.length > 0 ? carouselImages.map((image, index) => (
                                        <img key={index} alt={image.alt} className={`absolute inset-0 rounded-2xl shadow-2xl object-cover w-full h-full border-4 border-white rotate-3 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`} src={image.src} />
                                    )) : (
                                        // Placeholder caso não haja imagens
                                        <div className="w-full h-full bg-gray-200 rounded-2xl border-4 border-white rotate-3"></div>
                                    )}
                                    
                                </div>
                                <div className="absolute -bottom-6 -left-6 bg-white p-3 rounded-xl shadow-xl border border-gray-100 flex items-center gap-2 animate-bounce-slow">
                                    <div className="bg-green-100 p-1.5 rounded-full text-green-700">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase leading-tight">Status</p>
                                        <p className="text-sm font-bold text-gray-900">Em Estoque</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3">Viu, gostou, pegou. <br /><span className="text-[#8B0000]">Sem esperar.</span></h2>
                        <p className="text-base text-gray-600 mb-6 max-w-2xl leading-relaxed mx-auto">Aqui, todos os produtos já estão comigo.<br /> Pediu hoje, chegou hoje.</p>
                    </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:flex flex-row items-center w-full">
                    <div className="md:w-1/2 mb-12 md:mb-0">
                        <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-[#B22222]/20 text-[#8B0000] text-xs font-bold uppercase tracking-wider mb-6">
                            <MapPin size={14} />
                            Exclusivo para Salvador
                        </div>
                        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">Viu, gostou, pegou. <br /><span className="text-[#8B0000]">Sem esperar.</span></h2>
                        <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">Aqui na <span className="text-[#8B0000]"><strong>Vitoria</strong></span>, todos os produtos já estão comigo. Pediu hoje, chegou hoje.</p>
                    </div>
                    <div className="hidden md:flex md:w-1/2 justify-center relative">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#B22222]/20 rounded-full blur-xl"></div>
                            <div className="relative w-72 h-72 md:w-96 md:h-96">
                                {carouselImages.length > 0 ? carouselImages.map((image, index) => (
                                    <img key={index} alt={image.alt} className={`absolute inset-0 rounded-2xl shadow-2xl object-cover w-full h-full border-4 border-white rotate-3 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`} src={image.src} />
                                )) : (
                                    // Placeholder caso não haja imagens
                                    <div className="w-full h-full bg-gray-200 rounded-2xl border-4 border-white rotate-3"></div>
                                )}
                                
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white p-3 rounded-xl shadow-xl border border-gray-100 flex items-center gap-2 animate-bounce-slow">
                                <div className="bg-green-100 p-1.5 rounded-full text-green-700">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase leading-tight">Status</p>
                                    <p className="text-sm font-bold text-gray-900">Em Estoque</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;