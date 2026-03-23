import { listDownloads, saveDownload, removeDownload } from "../services/downloads-service.js";

function $(selector) {
  return document.querySelector(selector);
}

function ensureDownloadModal() {
  if ($("#download-modal")) return;

  const modal = document.createElement("div");
  modal.id = "download-modal";
  modal.className = "admin-modal hidden";
  modal.innerHTML = `
    <div class="admin-modal-overlay" data-close-download-modal="1"></div>
    <div class="admin-modal-panel">
      <div class="admin-modal-header">
        <h2 id="download-modal-title">Novo download</h2>
        <button type="button" class="admin-modal-close" data-close-download-modal="1">✕</button>
      </div>

      <form id="download-form" class="admin-modal-form">
        <input type="hidden" id="download-id" />

        <label>
          <span>Título do download</span>
          <input type="text" id="download-title" required />
        </label>

        <label>
          <span>Link do download</span>
          <input type="url" id="download-url" required />
        </label>

        <label>
          <span>Descrição (opcional)</span>
          <textarea id="download-description" rows="3"></textarea>
        </label>

        <label>
          <span>Imagem (opcional)</span>
          <input type="url" id="download-image-url" />
        </label>

        <div class="admin-modal-actions">
          <button type="button" class="button-outline" id="download-cancel">Cancelar</button>
          <button type="submit" class="button-primary" id="download-save">Salvar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll("[data-close-download-modal='1']").forEach((el) => {
    el.addEventListener("click", closeDownloadModal);
  });

  $("#download-cancel")?.addEventListener("click", closeDownloadModal);
  $("#download-form")?.addEventListener("submit", onSubmitDownloadForm);
}

function openDownloadModal(item = null) {
  ensureDownloadModal();

  $("#download-id").value = item?.id || "";
  $("#download-title").value = item?.title || "";
  $("#download-url").value = item?.url || "";
  $("#download-description").value = item?.description || "";
  $("#download-image-url").value = item?.imageUrl || "";
  $("#download-modal-title").textContent = item?.id ? "Editar download" : "Novo download";

  $("#download-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  setTimeout(() => $("#download-title")?.focus(), 50);
}

function closeDownloadModal() {
  $("#download-modal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function onSubmitDownloadForm(event) {
  event.preventDefault();

  const payload = {
    title: $("#download-title").value.trim(),
    url: $("#download-url").value.trim(),
    description: $("#download-description").value.trim(),
    imageUrl: $("#download-image-url").value.trim(),
    active: true
  };

  if (!payload.title || !payload.url) {
    alert("Preencha título e link do download.");
    return;
  }

  const id = $("#download-id").value.trim();

  try {
    const saveBtn = $("#download-save");
    if (saveBtn) saveBtn.disabled = true;
    await saveDownload(payload, id);
    closeDownloadModal();
    await renderList();
  } catch (error) {
    console.error("Erro ao salvar download:", error);
    alert("Não foi possível salvar o download.");
  } finally {
    const saveBtn = $("#download-save");
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function renderList() {
  const box = document.getElementById("admin-downloads-list");
  if (!box) return;

  const all = await listDownloads(false);
  box.innerHTML = `
    ${all.map((item) => `
      <div class="admin-list-card">
        <div><strong>${item.title || ""}</strong>${item.description ? `<p>${item.description}</p>` : ""}</div>
        <div class="admin-list-actions">
          <button class="button-outline" data-edit-id="${item.id}" type="button">Editar</button>
          <button class="button-danger" data-delete-id="${item.id}" type="button">Excluir</button>
        </div>
      </div>
    `).join("")}
  `;

  box.querySelectorAll("[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const allItems = await listDownloads(false);
      const item = allItems.find((x) => x.id === btn.dataset.editId);
      if (!item) return;
      openDownloadModal(item);
    });
  });

  box.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir download?")) return;
      await removeDownload(btn.dataset.deleteId);
      await renderList();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ensureDownloadModal();
  document.getElementById("new-download-button")?.addEventListener("click", () => openDownloadModal());
  renderList();
});
