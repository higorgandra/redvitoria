import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage.jsx'; // Importando o novo dashboard com a extensão
import DashboardHome from './DashboardHome.jsx';
import ProductsPage from './ProductsPage.jsx';
import CartPage from './CartPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx'; // 1. Importar o componente

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  const [cart, setCart] = useState([]);

  // Efeito para adicionar o Schema.org (JSON-LD) para SEO local
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "HealthAndBeautyBusiness",
      "name": "RedVitoria Cosméticos",
      "description": "Sua loja de pronta entrega de cosméticos Avon, Natura e O Boticário em Salvador, BA. Viu, gostou, pegou. Sem espera.",
      // TODO: Substitua pela URL completa da sua logo quando estiver online. Ex: "https://www.redvitoria.com.br/logo.png"
      "image": "", 
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Salvador",
        "addressRegion": "BA",
        "addressCountry": "BR"
      },
      "priceRange": "$$"
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  const clearCart = () => setCart([]);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage cart={cart} addToCart={addToCart} />} />
        <Route path="/carrinho" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} />} />
        <Route path="/login" element={<LoginPage />} />
        {/* 2. Envolver a rota do Dashboard com o ProtectedRoute */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }>
          <Route index element={<DashboardHome />} />
          <Route path="produtos" element={<ProductsPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;