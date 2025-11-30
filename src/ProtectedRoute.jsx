import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // O onAuthStateChanged é um "ouvinte" que notifica em tempo real
        // se o usuário está logado ou não.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Limpa o "ouvinte" quando o componente é desmontado para evitar vazamento de memória.
        return () => unsubscribe();
    }, []);

    // Enquanto verifica a autenticação, exibe uma tela de carregamento.
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin text-[#8B0000]" size={48} />
            </div>
        );
    }

    // Se não houver usuário logado, redireciona para a página de login.
    // O `replace` evita que o usuário possa voltar para a página de login com o botão "voltar" do navegador.
    return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;