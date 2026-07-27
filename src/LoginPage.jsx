import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, provider } from './firebaseAuth';
import { useAuth } from './AuthContext';
import { signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useBodyScrollLock } from './useBodyScrollLock';

const ADMIN_UID = "JC6P8EQrLBOc9fzKm3XdXkKGb0i1";

// O Safari do iOS bloqueia o popup do Firebase (e o ITP impede a troca de
// storage entre a janela do popup e a original, então mesmo quando o popup
// abre o login não conclui). Nesses navegadores usamos o fluxo de redirect,
// que o AuthContext finaliza com getRedirectResult ao voltar para a página.
const prefersRedirectAuth = () => {
  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/.test(ua)
    // iPadOS 13+ se apresenta como macOS; o toque desempata.
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  return isIOS || isSafari;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Para o estado do botão
  
  // Bloqueia o scroll do body enquanto a página de login estiver visível.
  useBodyScrollLock(true);

  // Efeito para redirecionar se o admin já estiver logado
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.uid === ADMIN_UID) {
      // Se o usuário do contexto for o admin, redireciona imediatamente.
      navigate('/dashboard', { replace: true });
      return;
    }

    // Conta sem permissão. Este caminho também cobre o fluxo de redirect,
    // em que a checagem não pode acontecer dentro de handleGoogleLogin
    // porque a página é recarregada antes de o login retornar.
    alert("Acesso restrito. Esta conta não tem permissão para entrar no painel.");
    signOut(auth);
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      if (prefersRedirectAuth()) {
        // Sai da página; o resultado é tratado pelo AuthContext no retorno e
        // a validação do UID acontece no useEffect acima.
        await signInWithRedirect(auth, provider);
        return;
      }

      await signInWithPopup(auth, provider);
      // O useEffect acima cuida do redirecionamento e da checagem de permissão.

    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
      alert("Houve um erro ao tentar fazer o login. Tente novamente.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen-dynamic bg-white flex flex-col items-center justify-start pt-20 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl">
        <div className="flex flex-col items-center">
          <div className="bg-[#8B0000] text-white p-3 rounded-lg mb-4 transform -rotate-6">
            <ShoppingBag size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            <span className="text-[#8B0000]">VITÓRIA</span>
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
            <img className="w-6 h-6" loading="lazy" decoding="async" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          )}
          <span className="text-sm font-medium text-gray-700">{isLoggingIn ? 'Aguarde...' : 'Entrar com Google'}</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;