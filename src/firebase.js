// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, updateDoc, increment, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration - Hardcoded for testing
const firebaseConfig = {
  apiKey: "AIzaSyBjJOtr6wCPn2CflxpP61mKuVjOlDDGQJc", // Lembre-se de proteger suas chaves em um ambiente de produção
  authDomain: "red-vitoria.firebaseapp.com",
  projectId: "red-vitoria",
  storageBucket: "red-vitoria.firebasestorage.app",
  messagingSenderId: "930933617786",
  appId: "1:930933617786:web:1868a4f5b27d99a3d6f7c3"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

/**
 * Incrementa um contador de métrica no Firestore.
 * Cria o documento de métricas se ele não existir.
 * @param {'addToCartClicks' | 'whatsappClicks' | 'adCardClicks'} metricName O nome do campo a ser incrementado.
 */
export const incrementMetric = async (metricName) => {
  const metricsRef = doc(db, 'metrics', 'userInteractions');
  try {
    // Tenta incrementar o valor.
    await updateDoc(metricsRef, {
      [metricName]: increment(1)
    });
  } catch (error) {
    // Se o documento não existir, o updateDoc falhará.
    // Então, criamos o documento com o valor inicial 1 para a métrica clicada.
    if (error.code === 'not-found') {
      console.log("Documento de métricas não encontrado. Criando um novo...");
      try {
        await setDoc(metricsRef, { 
          [metricName]: 1 
        });
      } catch (set_error) {
        console.error("Erro ao criar documento de métricas:", set_error);
      }
    } else {
      console.error("Erro ao incrementar métrica:", error);
    }
  }
};