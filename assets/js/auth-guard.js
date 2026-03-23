import { watchAuth } from "./auth.js";

const ADMIN_EMAILS = [
  "lindolfoandrew0@gmail.com",
  "andrewlindolfo90@gmail.com"
];

function normalize(email=""){
  return String(email).trim().toLowerCase();
}

watchAuth((user) => {

  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const email = normalize(user.email);

  if (!ADMIN_EMAILS.includes(email)) {
    alert("Seu e-mail não está autorizado para acessar a área administrativa.");
    window.location.href = "/login.html";
  }

});