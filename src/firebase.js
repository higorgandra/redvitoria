// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 1. Importar o Firestore


// Your web app's Firebase configuration - Hardcoded for testing
const firebaseConfig = {
  apiKey: "AIzaSyBjJOtr6wCPn2CflxpP61mKuVjOlDDGQJc",
  authDomain: "red-vitoria.firebaseapp.com",
  projectId: "red-vitoria",
  storageBucket: "red-vitoria.firebasestorage.app",
  messagingSenderId: "930933617786",
  appId: "1:930933617786:web:1868a4f5b27d99a3d6f7c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 2. Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Exporta as instâncias para serem usadas em outros lugares
export { auth, provider, signInWithPopup, db }; // 3. Exportar o 'db'