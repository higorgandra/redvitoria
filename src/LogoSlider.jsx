import React from 'react';

// Logos das marcas parceiras, servidas do próprio site (public/logos).
const logos = [
  { name: 'Natura', src: '/logos/natu.png' },
  { name: 'O Boticário', src: '/logos/oboti.png' },
  { name: 'Avon', src: '/logos/novo-logo-avon-png.png' },
  { name: 'Quem disse, berenice?', src: '/logos/quempng.png' },
  { name: 'O.U.I', src: '/logos/ouipng.png' },
  { name: 'L`Occitane au Brésil', src: '/logos/locpng.png' },
  { name: 'Eudora', src: '/logos/eudorapng.png' },
];

const LogoSlider = () => {
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">
          Marcas que você ama
        </h3>
        <div className="relative overflow-hidden whitespace-nowrap [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <div className="flex w-max animate-[slide_30s_linear_infinite]">
            {/* Renderiza o primeiro conjunto de logos */}
            {logos.map((logo, index) => (
              <div key={`logo1-${index}`} className="flex-shrink-0 w-48 mx-8 flex items-center justify-center">
                <img src={logo.src} alt={logo.name} loading="lazy" decoding="async" className="max-h-8 w-auto object-contain grayscale opacity-60" />
              </div>
            ))}
            {/* Renderiza o segundo conjunto de logos para o loop contínuo */}
            {logos.map((logo, index) => (
              <div key={`logo2-${index}`} className="flex-shrink-0 w-48 mx-8 flex items-center justify-center">
                <img src={logo.src} alt={logo.name} loading="lazy" decoding="async" className="max-h-8 w-auto object-contain grayscale opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoSlider;