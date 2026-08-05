import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import HomePage from './HomePage';
import ProductDetailPage from './ProductDetailPage.jsx'; // Importando a nova página de produto
import CartPage from './CartPage.jsx';
import SocialPage from './SocialPage.jsx'; // Importar a nova página

// O painel administrativo e a tela de login só interessam ao admin, mas
// estavam no mesmo bundle que a loja. Carregados sob demanda, saem do caminho
// crítico. O AuthLayout e o ProtectedRoute entram na lista porque são eles que
// puxam o `firebase/auth`: enquanto fossem importados aqui de forma estática,
// o SDK de autenticação continuaria no bundle principal.
const AuthLayout = lazy(() => import('./AuthLayout.jsx'));
const ProtectedRoute = lazy(() => import('./ProtectedRoute.jsx'));
const LoginPage = lazy(() => import('./LoginPage.jsx'));
const DashboardPage = lazy(() => import('./DashboardPage.jsx'));
const DashboardHome = lazy(() => import('./DashboardHome.jsx'));
const ProductsPage = lazy(() => import('./ProductsPage.jsx'));

const RouteFallback = () => (
  <div className="flex justify-center items-center h-screen-dynamic bg-white">
    <Loader2 className="animate-spin text-[#8B0000]" size={48} />
  </div>
);

import { db } from './firebase';
import { safeSessionStorage } from './safeStorage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ScrollToTop = () => {
  const { pathname, state } = useLocation();

  useEffect(() => {
    // Só rola para o topo se não for uma navegação "para trás"
    if (state?.preventScroll !== true) {
      window.scrollTo(0, 0);
    }
  }, [pathname, state]);
  return null;
};

const App = () => {
  const [cart, setCart] = useState([]);

  // Efeito para registrar visitas (Contador de Visitas)
  useEffect(() => {
    const recordVisit = async () => {
      // Verifica se já visitou nesta sessão (evita contar F5 como nova visita)
      const hasVisited = safeSessionStorage.get('visit_recorded');
      if (!hasVisited) {
        try {
          await addDoc(collection(db, 'visits'), {
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent // Salva info do navegador (útil para saber se é mobile/desktop)
          });
          safeSessionStorage.set('visit_recorded', 'true');
        } catch (error) {
          console.error("Erro ao registrar visita:", error);
        }
      }
    };
    recordVisit();
  }, []);

  // Efeito para adicionar o Schema.org (JSON-LD) para SEO local
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "HealthAndBeautyBusiness",
      "name": "RedVitoria Cosméticos",
      "description": "Sua loja de pronta entrega de cosméticos Avon, Natura e O Boticário em Salvador, BA. Viu, gostou, pegou. Sem espera.",
      "image": window.location.origin + "/favicon.svg",
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

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prevCart, { ...product, quantity: quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Função de atualização de quantidade ajustada para validar o estoque
  const updateQuantity = (productId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        // Calcula a nova quantidade
        const newQuantity = item.quantity + delta;
        // Garante que a quantidade seja no mínimo 1 e no máximo o estoque disponível
        const validatedQuantity = Math.max(1, Math.min(newQuantity, item.stock));
        return { ...item, quantity: validatedQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage cart={cart} addToCart={addToCart} />} />
            <Route path="/carrinho" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} />} />
            <Route path="/produto/:productId" element={<ProductDetailPage cart={cart} addToCart={addToCart} />} />
            <Route path="/social" element={<SocialPage />} />

            {/* Área autenticada. O AuthLayout é uma rota-layout sem caminho:
                ele só fornece o AuthProvider para as rotas aninhadas, em vez
                de envolver a loja inteira. */}
            <Route element={<AuthLayout />}>
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
            </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;