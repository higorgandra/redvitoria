import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, provider } from './firebase'; // Importaremos do firebase.js
import { useAuth } from './AuthContext';
import { signInWithPopup, signOut } from "firebase/auth";
import { ShoppingBag, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Para o estado do botão
  
  // Efeito para bloquear o scroll do body enquanto a página de login estiver visível
  useEffect(() => {
    document.body.classList.add('overflow-hidden');

    // Função de limpeza para remover a classe quando o componente for desmontado
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []); // Array vazio garante que o efeito rode apenas na montagem e desmontagem

  // Efeito para redirecionar se o admin já estiver logado
  useEffect(() => {
    const ADMIN_UID = "JC6P8EQrLBOc9fzKm3XdXkKGb0i1";
    if (currentUser && currentUser.uid === ADMIN_UID) {
      // Se o usuário do contexto for o admin, redireciona imediatamente.
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const ADMIN_UID = "JC6P8EQrLBOc9fzKm3XdXkKGb0i1";

      if (user.uid !== ADMIN_UID) {
        // Se não for o admin, exibe o alerta e faz o logout.
        alert("Acesso restrito. Esta conta não tem permissão para entrar no painel.");
        await signOut(auth);
      }
      // Se for o admin, o useEffect acima cuidará do redirecionamento para o dashboard.

    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
      alert("Houve um erro ao tentar fazer o login. Tente novamente.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-20 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl">
        <div className="flex flex-col items-center">
          <div className="bg-[#8B0000] text-white p-3 rounded-lg mb-4 transform -rotate-6">
            <ShoppingBag size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            RED<span className="text-[#8B0000]">VITORIA</span>
          </h1>
          <p className="text-gray-500 mt-1">Acesso ao Painel Administrativo</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-wait"
        >
          {isLoggingIn ? (
            <Loader2 className="animate-spin text-gray-500" size={20} />
          ) : (
            <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          )}
          <span className="text-sm font-medium text-gray-700">{isLoggingIn ? 'Aguarde...' : 'Entrar com Google'}</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;