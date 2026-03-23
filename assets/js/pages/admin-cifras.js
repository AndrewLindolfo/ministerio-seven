import { listCifras, removeCifra } from "../services/cifras-service.js";

async function renderCifras() {
  const box = document.getElementById("admin-cifras-list");
  const search = document.getElementById("admin-cifras-search");
  if (!box) return;

  const all = await listCifras(false);
  const term = String(search?.value || "").trim().toLowerCase();
  const filtered = all.filter((item) => String(item.title || "").toLowerCase().includes(term));

  box.innerHTML = filtered.length ? filtered.map((item) => `
    <div class="admin-list-card">
      <div>
        <strong>${item.title || ""}</strong>
        ${item.subtitle ? `<p>${item.subtitle}</p>` : ""}
      </div>
      <div class="admin-list-actions">
        <a class="button-outline" href="./editor-cifra.html?id=${item.id}">Editar</a>
        <button class="button-danger" type="button" data-delete-id="${item.id}">Excluir</button>
      </div>
    </div>
  `).join("") : "<p>Nenhuma cifra cadastrada.</p>";

  box.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Deseja excluir esta cifra?")) return;
      await removeCifra(button.dataset.deleteId);
      alert("🗑️ Cifra excluída com sucesso!");
      await renderCifras();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("admin-cifras-search")?.addEventListener("input", renderCifras);
  await renderCifras();
});
