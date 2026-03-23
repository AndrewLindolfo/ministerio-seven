import { listMusicas, removeMusica } from "../services/musicas-service.js";

async function renderMusicas() {
  const box = document.getElementById("admin-musicas-list");
  const search = document.getElementById("admin-musicas-search");
  if (!box) return;

  const all = await listMusicas(false);
  const term = String(search?.value || "").trim().toLowerCase();
  const filtered = all.filter((item) => String(item.title || "").toLowerCase().includes(term));

  box.innerHTML = filtered.length ? filtered.map((item) => `
    <div class="admin-list-card">
      <div>
        <strong>${item.title || ""}</strong>
        ${item.subtitle ? `<p>${item.subtitle}</p>` : ""}
      </div>
      <div class="admin-list-actions">
        <a class="button-outline" href="./editor-musica.html?id=${item.id}">Editar</a>
        <button class="button-danger" type="button" data-delete-id="${item.id}">Excluir</button>
      </div>
    </div>
  `).join("") : "<p>Nenhuma música cadastrada.</p>";

  box.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Deseja excluir esta música?")) return;
      await removeMusica(button.dataset.deleteId);
      alert("🗑️ Música excluída com sucesso!");
      await renderMusicas();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("admin-musicas-search")?.addEventListener("input", renderMusicas);
  await renderMusicas();
});
