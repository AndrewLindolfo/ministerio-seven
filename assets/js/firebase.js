// Firebase configuração — Ministério Seven
// Gerado automaticamente

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASNVe89Q5GuoVLKXN7Ru8GxuK0_g0bfBA",
  authDomain: "ministerio-seven.firebaseapp.com",
  projectId: "ministerio-seven",
  storageBucket: "ministerio-seven.firebasestorage.app",
  messagingSenderId: "63038697804",
  appId: "1:63038697804:web:d1c69d6f6b39a590e31fe9",
  measurementId: "G-P9J8Q77FVR"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Serviços usados no site
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, provider, db };