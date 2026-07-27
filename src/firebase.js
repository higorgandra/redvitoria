// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, increment, setDoc, collection, getDoc, getDocs, query, orderBy } from "firebase/firestore";

// Configuração do Firebase.
//
// Estes valores NÃO são segredo e não precisam ir para variáveis de ambiente:
// numa aplicação web eles são obrigatoriamente entregues ao navegador, e a
// `apiKey` do Firebase apenas identifica o projeto — ela não autentica
// ninguém. Deixá-los no código é o comportamento documentado pelo Firebase.
//
// Quem de fato controla o acesso são as regras em `firestore.rules`, na raiz
// do repositório. Se elas estiverem abertas, esconder estas linhas não protege
// nada; se estiverem corretas, expô-las não causa dano.
const firebaseConfig = {
  apiKey: "AIzaSyBjJOtr6wCPn2CflxpP61mKuVjOlDDGQJc",
  authDomain: "red-vitoria.firebaseapp.com",
  projectId: "red-vitoria",
  storageBucket: "red-vitoria.firebasestorage.app",
  messagingSenderId: "930933617786",
  appId: "1:930933617786:web:1868a4f5b27d99a3d6f7c3"
};
// `app` e exportado para que firebaseAuth.js reaproveite a mesma instancia.
export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

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

// `trackVisit` foi removida: buscava geolocalização em http://ip-api.com
// (HTTP puro numa página HTTPS), o que é bloqueado como conteúdo misto por
// qualquer navegador moderno, e acessava sessionStorage sem proteção. Nunca
// chegou a ser chamada — o registro de visitas vive em App.jsx. O plano
// gratuito do ip-api.com não oferece HTTPS, então reativar exigiria outro
// provedor de geolocalização.

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