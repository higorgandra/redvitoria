// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Lembre-se de proteger suas chaves em um ambiente de produção
import { getFirestore, doc, updateDoc, increment, setDoc, collection, addDoc, serverTimestamp, getDoc, getDocs, query, orderBy } from "firebase/firestore";

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

/**
 * Registra uma visita ao site com informações de geolocalização do usuário.
 * Utiliza uma API externa para obter cidade e país a partir do IP.
 */
export const trackVisit = async () => {
  // Evita rastrear múltiplas visitas na mesma sessão de navegação
  if (sessionStorage.getItem('visitTracked')) {
    return;
  }

  try {
    const response = await fetch('http://ip-api.com/json/?fields=country,city');
    if (!response.ok) {
      throw new Error('A resposta da API de geolocalização não foi OK.');
    }
    const data = await response.json();

    const visitsCollectionRef = collection(db, 'visits');
    await addDoc(visitsCollectionRef, {
      city: data.city || 'Unknown',
      country: data.country || 'Unknown',
      timestamp: serverTimestamp()
    });

    // Marca que a visita já foi registrada nesta sessão
    sessionStorage.setItem('visitTracked', 'true');
  } catch (error) {
    console.error("Erro ao registrar visita:", error);
  }
};

/**
 * Busca todos os dados de métricas do Firestore, incluindo interações e visitas.
 * @returns {Promise<{interactions: object, visits: Array<object>}>} Uma promessa que resolve para um objeto com as métricas.
 */
export const getMetrics = async () => {
  try {
    // Busca as métricas de interação (cliques)
    const metricsRef = doc(db, 'metrics', 'userInteractions');
    const metricsSnap = await getDoc(metricsRef);
    const interactions = metricsSnap.exists() ? metricsSnap.data() : {};

    // Busca os registros de visitas
    const visitsCollectionRef = collection(db, 'visits');
    const q = query(visitsCollectionRef, orderBy('timestamp', 'desc'));
    const visitsSnap = await getDocs(q);
    
    const visits = [];
    visitsSnap.forEach((doc) => {
      visits.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { interactions, visits };

  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    // Retorna um objeto vazio em caso de erro para não quebrar a aplicação
    return { interactions: {}, visits: [] };
  }
};