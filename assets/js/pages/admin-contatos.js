import { watchAuth, getAdminProfileByEmail } from "../auth.js";
import { hasPermission } from "../services/admin-permissions-service.js";
import { getCollection, updateDocument } from "../db.js";

async function renderList() {
  const box = document.getElementById("admin-contatos-list");
  if (!box) return;
  const all = await getCollection("contatos");
  const ordered = all.sort((a, b) => String(b.id).localeCompare(String(a.id)));

  box.innerHTML = ordered.length ? ordered.map((item) => `
    <div class="admin-list-card">
      <div>
        <strong>${item.nome || ""} — ${item.assunto || ""}</strong>
        <p>${item.email || ""}</p>
        <p>${item.mensagem || ""}</p>
      </div>
      <div class="admin-list-actions">
        <button class="button-outline" type="button" data-mark-id="${item.id}">${item.lido ? "Lido" : "Marcar como lido"}</button>
      </div>
    </div>
  `).join("") : "<p>Nenhum contato recebido.</p>";

  box.querySelectorAll("[data-mark-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateDocument("contatos", btn.dataset.markId, { lido: true });
      await renderList();
    });
  });
}

document.addEventListener("DOMContentLoaded", renderList);

watchAuth(async (user) => {
  if (!user?.email) return;
  const admin = await getAdminProfileByEmail(user.email);
  if (!admin) return;
  const refresh = async () => {
    await renderList();
    if (!hasPermission(admin,'contatos','view')) {
      const box = document.getElementById('admin-contatos-list');
      if (box) box.innerHTML = '<p>Você não tem permissão para ver contatos.</p>';
      return;
    }
    document.querySelectorAll('[data-mark-id]').forEach((el)=>el.classList.toggle('hidden', !hasPermission(admin,'contatos','delete')));
  };
  await refresh();
});
