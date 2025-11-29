import React from 'react';
import { auth, provider } from './firebase'; // Importaremos do firebase.js
import { signInWithPopup } from "firebase/auth";
import { ShoppingBag } from 'lucide-react';

const LoginPage = () => {

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // O usuário está logado.
      const user = result.user;
      console.log("Usuário logado com sucesso:", user);
      alert(`Bem-vindo(a), ${user.displayName}!`);
      // Aqui você pode redirecionar o usuário para uma página de dashboard, por exemplo.
      // window.location.href = '/dashboard';
    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
      alert("Houve um erro ao tentar fazer o login. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
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
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          <span className="text-sm font-medium text-gray-700">Entrar com Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;