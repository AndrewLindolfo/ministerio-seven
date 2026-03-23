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
