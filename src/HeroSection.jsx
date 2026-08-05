import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Package } from 'lucide-react';
import { incrementMetric } from './firebase';

// Componente para o ícone personalizado do WhatsApp
const WhatsAppIcon = ({ size = 24 }) => (
    <svg fill="currentColor" width={size} height={size} viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <title>whatsapp</title>
        <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z" />
    </svg>
);

// Texto que já chega escrito na conversa quando a pessoa toca no botão.
const whatsappMessage = 'Olá, Vitória! Vi seu site e gostaria de saber mais sobre os produtos a pronta entrega.';
const whatsappUrl = `https://wa.me/5571992293834?text=${encodeURIComponent(whatsappMessage)}`;

const HeroSection = ({ products = [] }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Filtra os produtos para criar a lista de imagens do carrossel.
    // Limitado a 5: todas as imagens ficam no viewport (o lazy loading não as
    // adia), então cada produto a mais é um download competindo com a abertura
    // da página.
    const carouselImages = products
        .filter(p => p.stock > 0 && p.image && p.status !== 'Anúncio')
        .slice(0, 5)
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
                                        <img key={index} alt={image.alt} {...(index === 0 ? { fetchPriority: "high" } : { loading: "lazy" })} decoding="async" className={`absolute inset-0 rounded-2xl shadow-2xl object-cover w-full h-full border-4 border-white rotate-3 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`} src={image.src} />
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
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => incrementMetric('heroWhatsappClicks')}
                            className="flex items-center justify-center gap-3 w-full max-w-sm mx-auto bg-[#25D366] hover:bg-[#1EBE5D] text-white text-lg font-bold px-8 py-4 rounded-full shadow-lg shadow-green-500/30 transition-transform duration-300 ease-out transform hover:scale-[1.03]"
                        >
                            <WhatsAppIcon size={26} />
                            Chamar no WhatsApp
                        </a>
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
                        <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">Aqui na <span className="text-[#8B0000]"><strong>Vitória</strong></span>, todos os produtos já estão comigo. Pediu hoje, chegou hoje.</p>
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => incrementMetric('heroWhatsappClicks')}
                            className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-lg font-bold px-10 py-4 rounded-full shadow-lg shadow-green-500/30 transition-transform duration-300 ease-out transform hover:scale-[1.03]"
                        >
                            <WhatsAppIcon size={26} />
                            Chamar no WhatsApp
                        </a>
                    </div>
                    <div className="hidden md:flex md:w-1/2 justify-center relative">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#B22222]/20 rounded-full blur-xl"></div>
                            <div className="relative w-72 h-72 md:w-96 md:h-96">
                                {carouselImages.length > 0 ? carouselImages.map((image, index) => (
                                    <img key={index} alt={image.alt} {...(index === 0 ? { fetchPriority: "high" } : { loading: "lazy" })} decoding="async" className={`absolute inset-0 rounded-2xl shadow-2xl object-cover w-full h-full border-4 border-white rotate-3 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`} src={image.src} />
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