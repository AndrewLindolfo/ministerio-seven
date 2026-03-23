import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ADMINS AUTORIZADOS DIRETAMENTE
const ADMIN_EMAILS = [
  "lindolfoandrew0@gmail.com",
  "andrewlindolfo90@gmail.com"
];

function normalize(email = "") {
  return String(email).trim().toLowerCase();
}

function isAdmin(email) {
  const e = normalize(email);
  return ADMIN_EMAILS.includes(e);
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const email = normalize(user?.email || "");

    if (!isAdmin(email)) {
      await signOut(auth);
      alert("Seu e-mail não está autorizado como administrador.\n\nE-mail detectado: " + email);
      return;
    }

    window.location.href = "/admin/index.html";

  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro ao fazer login com Google.");
  }
}

export async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}