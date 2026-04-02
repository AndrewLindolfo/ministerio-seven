import { watchAuth, getAdminProfileByEmail } from "./auth.js";
import { canAccessAdminPage } from "./services/admin-permissions-service.js";

function normalize(email = "") {
  return String(email).trim().toLowerCase();
}

function resolveAdminPageKey() {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  if (path.endsWith("/admin/index.html")) return "dashboard";
  if (path.endsWith("/admin/admins.html")) return "admins";
  if (path.endsWith("/admin/musicas.html")) return "musicas";
  if (path.endsWith("/admin/editor-musica.html")) return params.get("id") ? "editor-musica-edit" : "editor-musica-create";
  if (path.endsWith("/admin/cifras.html")) return "cifras";
  if (path.endsWith("/admin/editor-cifra.html")) return params.get("id") ? "editor-cifra-edit" : "editor-cifra-create";
  if (path.endsWith("/admin/programacoes.html")) return "programacoes";
  if (path.endsWith("/admin/fotos.html")) return "fotos";
  if (path.endsWith("/admin/downloads.html")) return "downloads";
  if (path.endsWith("/admin/downloads-geral.html")) return "downloads-geral";
  if (path.endsWith("/admin/downloads-por-musica.html")) return "downloads-por-musica";
  if (path.endsWith("/admin/contatos.html")) return "contatos";
  if (path.endsWith("/admin/notificacoes.html")) return "notificacoes";
  if (path.endsWith("/admin/links.html")) return "links";
  if (path.endsWith("/admin/backup.html")) return "backup";
  return "dashboard";
}

export function protectAdminPage() {
  watchAuth(async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    try {
      const admin = await getAdminProfileByEmail(normalize(user.email));
      if (!admin) {
        alert("Seu e-mail não está autorizado para acessar a área administrativa.");
        window.location.href = "/login.html";
        return;
      }

      const pageKey = resolveAdminPageKey();
      if (!canAccessAdminPage(admin, pageKey)) {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "/admin/index.html";
      }
    } catch (error) {
      console.error("Erro ao validar acesso administrativo:", error);
      alert("Não foi possível validar o acesso administrativo.");
      window.location.href = "/login.html";
    }
  });
}

protectAdminPage();
