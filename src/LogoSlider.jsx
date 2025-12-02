import React from 'react';

// Logos das marcas parceiras
const logos = [
  { name: 'Natura', src: 'https://i.postimg.cc/W3gxtx6D/natu.png' },
  { name: 'O Boticário', src: 'https://i.postimg.cc/RFhzFgpJ/oboti.png' },
  { name: 'Avon', src: 'https://gkpb.com.br/wp-content/uploads/2021/01/novo-logo-avon-png.png' },
  { name: 'Quem disse, berenice?', src: 'https://i.postimg.cc/B65vfrhb/quempng.png' },
  { name: 'O.U.I', src: 'https://i.postimg.cc/gJy0bCMx/ouipng.png' },
  { name: 'L`Occitane au Brésil', src: 'https://i.postimg.cc/V69NPx7t/locpng.png' },
  { name: 'Eudora', src: 'https://i.postimg.cc/j56jYp8W/eudorapng.png' },
];

// Duplicamos os logos para criar o efeito de loop infinito
const extendedLogos = [...logos, ...logos];

const LogoSlider = () => {
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">
          Marcas que você ama
        </h3>
        <div className="relative overflow-hidden whitespace-nowrap [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <div className="inline-block animate-[slide_80s_linear_infinite]">
            {extendedLogos.map((logo, index) => (
              <div key={index} className="inline-flex items-center justify-center w-48 h-16 mx-8">
                <img src={logo.src} alt={logo.name} className="max-h-8 w-auto object-contain grayscale opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoSlider;