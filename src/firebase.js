// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, increment, setDoc } from "firebase/firestore";

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
 * O setDoc com merge cria o documento se ele não existir.
 * @param {'addToCartClicks' | 'whatsappClicks' | 'adCardClicks' | 'heroWhatsappClicks'} metricName O nome do campo a ser incrementado.
 */
export const incrementMetric = async (metricName) => {
  const metricsRef = doc(db, 'metrics', 'userInteractions');
  try {
    await setDoc(metricsRef, { [metricName]: increment(1) }, { merge: true });
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.warn("Métrica não registrada por falta de permissão. Verifique as Regras do Firestore.");
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
