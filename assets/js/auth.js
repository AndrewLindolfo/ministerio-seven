import { auth, provider } from "./firebase.js";
import { getOneByField } from "./db.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function normalize(email = "") {
  return String(email).trim().toLowerCase();
}

export async function getAdminProfileByEmail(email = "") {
  const normalizedEmail = normalize(email);
  if (!normalizedEmail) return null;
  const admin = await getOneByField("admins", "email", normalizedEmail);
  if (!admin) return null;
  if (admin.ativo === false || admin.active === false) return null;
  return admin;
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = normalize(user?.email || "");
    const admin = await getAdminProfileByEmail(email);

    if (!admin) {
      await signOut(auth);
      alert("Seu e-mail não está autorizado como administrador.\n\nE-mail detectado: " + email);
      return;
    }

    window.location.href = "/admin/index.html";
  } catch (error) {
    console.error("Erro no login:", error);
    alert(`Erro ao fazer login com Google: ${error.code || error.message || "desconhecido"}`);
  }
}

export async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
