import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth(); // 1. Obter o estado de 'loading' do contexto
    const ADMIN_UID = "JC6P8EQrLBOc9fzKm3XdXkKGb0i1";

    useEffect(() => {
        // Este efeito é acionado sempre que o currentUser muda.
        if (!loading && currentUser && currentUser.uid !== ADMIN_UID) {
            // Se um usuário está logado mas NÃO é o admin, exibe o alerta e o expulsa.
            alert("Acesso restrito. Esta conta não tem permissão para entrar no painel.");
            signOut(auth);
        }
    }, [currentUser, loading]);

    // 2. Enquanto o AuthContext estiver carregando, exibe uma tela de loading.
    // Isso impede qualquer redirecionamento prematuro.
    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-white"><Loader2 className="animate-spin text-[#8B0000]" size={48} /></div>;
    }

    // 3. Após o carregamento, se o usuário não for o admin, redireciona para o login.
    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        return <Navigate to="/login" replace />;
    }

    // Se passou pelas verificações, é o admin. Permite o acesso.
    return children;
};

export default ProtectedRoute;