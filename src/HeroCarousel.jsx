import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroCarousel = ({ products = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Transforma os produtos em banners, pegando apenas os 5 primeiros com imagem.
  const banners = products
    .filter(p => p.image && p.status === 'Ativo')
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      image: p.image,
      alt: p.name,
      link: p.link && p.link.trim() ? p.link : `/produto/${p.id}`
    }));

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? banners.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === banners.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000); // Muda a cada 5 segundos
    return () => clearInterval(slideInterval);
  }, [currentIndex]);

  if (banners.length === 0) {
    // Mostra um placeholder se não houver banners/produtos
    return <div className="relative w-full h-48 md:h-64 lg:h-[340px] bg-gray-200 animate-pulse"></div>;
  }

  const currentLink = banners[currentIndex].link;
  const isInternal = currentLink && (currentLink.startsWith('/') || currentLink.includes(window.location.origin) || currentLink.includes('/produto/'));

  return (
    <div className="relative w-full h-48 md:h-64 lg:h-[340px] group">
      {isInternal ? (
        <Link to={new URL(currentLink, window.location.href).pathname + new URL(currentLink, window.location.href).search + new URL(currentLink, window.location.href).hash}>
          <div style={{ backgroundImage: `url(${banners[currentIndex].image})` }} className="w-full h-full bg-center bg-cover duration-500"></div>
        </Link>
      ) : (
        <a href={currentLink} target="_blank" rel="noopener noreferrer">
          <div style={{ backgroundImage: `url(${banners[currentIndex].image})` }} className="w-full h-full bg-center bg-cover duration-500"></div>
        </a>
      )}
      {/* Left Arrow */}
      <div className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 left-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer">
        <ChevronLeft onClick={prevSlide} size={30} />
      </div>
      {/* Right Arrow */}
      <div className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 right-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer">
        <ChevronRight onClick={nextSlide} size={30} />
      </div>
      <div className="flex top-4 justify-center py-2 absolute bottom-4 left-0 right-0">
        {banners.map((_, slideIndex) => (
          <div key={slideIndex} onClick={() => setCurrentIndex(slideIndex)} className={`text-2xl cursor-pointer mx-1 ${currentIndex === slideIndex ? 'text-white' : 'text-white/50'}`}>•</div>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;