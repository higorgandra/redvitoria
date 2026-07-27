// O Safari do iOS lança SecurityError ao simplesmente *tocar* em
// sessionStorage quando o usuário ativa "Bloquear todos os cookies"
// (Ajustes > Safari). Como o acesso é síncrono, uma exceção aqui derruba o
// fluxo inteiro que a chamou. Nunca use a API direto.
export const safeSessionStorage = {
  get(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Nada a fazer: o armazenamento está indisponível.
    }
  },
};
