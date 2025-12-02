import React from 'react';
import { Instagram, MessageCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Dados dos links
const socialLinks = [
  {
    icon: <Instagram size={24} />,
    url: 'https://www.instagram.com/consultoravitoriamgandra',
    'aria-label': 'Instagram',
  },
  {
    icon: <MessageCircle size={24} />,
    url: 'https://wa.me/5571992293834',
    'aria-label': 'WhatsApp',
  },
];

const mainLinks = [
  {
    icon: <ShoppingBag size={20} />,
    title: 'Ver Vitrine de Produtos',
    url: '/',
    isInternal: true,
  },
  {
    icon: <MessageCircle size={20} />,
    title: 'Falar no WhatsApp',
    url: 'https://wa.me/5571992293834',
    isInternal: false,
  },
  {
    icon: <Instagram size={20} />,
    title: 'Meu Instagram',
    url: 'https://www.instagram.com/consultoravitoriamgandra',
    isInternal: false,
  },
];

const LinkButton = ({ link }) => {
  const commonClasses = "group flex items-center justify-center w-full text-center p-4 rounded-lg font-semibold transition-transform duration-300 ease-out transform hover:scale-[1.02] shadow-md";

  const content = (
    <>
      <span className="absolute left-4">{link.icon}</span>
      {link.title}
      <ArrowRight size={20} className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </>
  );

  if (link.isInternal) {
    return (
      <Link to={link.url} className={`${commonClasses} bg-[#8B0000] text-white`}>
        {content}
      </Link>
    );
  }

  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={`${commonClasses} bg-white text-gray-800 border border-gray-200`}>
      {content}
    </a>
  );
};

const RedesSociaisPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col items-center justify-between p-4">
      <main className="w-full max-w-lg mx-auto flex flex-col items-center pt-12">
        {/* Profile Header */}
        <img
          src="https://i.postimg.cc/RFWS3s7N/571330743-18534298507005557-1264770583319279576-n.jpg"
          alt="Vitória Mota"
          className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-900">@consultoravitoriamgandra</h1>
        <p className="text-gray-600 mt-2 text-center">Pronta entrega de cosméticos em Salvador/BA.</p>

        {/* Social Icons */}
        <div className="flex items-center gap-6 mt-6">
          {socialLinks.map((link, index) => (
            <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link['aria-label']} className="text-gray-500 hover:text-[#8B0000] transition-transform duration-300 hover:scale-110">
              {link.icon}
            </a>
          ))}
        </div>

        {/* Main Links */}
        <div className="w-full mt-8 space-y-4">
          {mainLinks.map((link, index) => (
            <LinkButton key={index} link={link} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <Link to="/" className="text-lg font-black text-gray-900 tracking-tight hover:opacity-80 transition">
          <span className="text-[#8B0000]">RED</span>VITORIA
        </Link>
      </footer>
    </div>
  );
};

export default RedesSociaisPage;