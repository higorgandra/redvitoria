import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChanged é a única fonte da verdade. Ele é acionado
        // após o login por redirecionamento ser concluído e também em
        // recarregamentos de página, lendo o estado do cache.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false); // Libera a aplicação somente após o estado ser confirmado.
        });
        
        return () => unsubscribe(); // Limpa o listener ao desmontar.
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <Loader2 className="animate-spin text-[#8B0000]" size={48} />
            </div>
        );
    }

    return <AuthContext.Provider value={{ currentUser, loading }}>{children}</AuthContext.Provider>;
};