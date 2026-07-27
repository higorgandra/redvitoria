import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';

// Rota-layout que fornece o AuthProvider apenas para /login e /dashboard.
//
// Antes o AuthProvider envolvia a aplicação inteira em App.jsx, o que
// arrastava o `firebase/auth` para o bundle principal — todo cliente da loja
// baixava o SDK de autenticação sem nunca usá-lo. Como este arquivo é
// carregado com React.lazy, o SDK agora só desce quando alguém abre a área
// administrativa.
const AuthLayout = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

export default AuthLayout;
