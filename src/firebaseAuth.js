import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { app } from './firebase';

// O `auth` e o `provider` moram aqui, e não em firebase.js, por causa do peso
// do bundle: firebase.js é importado por praticamente toda a loja (é de onde
// vem o `db`), então tudo que ele importa vai parar no bundle principal. Com
// o `firebase/auth` isolado neste módulo — usado só por AuthContext,
// ProtectedRoute, LoginPage, DashboardPage e useAuth, todos carregados sob
// demanda — o SDK de autenticação só desce para quem abre a área
// administrativa. Reaproveita a mesma instância de `app`.
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
