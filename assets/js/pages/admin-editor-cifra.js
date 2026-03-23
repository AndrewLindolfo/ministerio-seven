import "../editor.js";
import { setCifraEditorHtml, getCifraEditorPlainText, getCifraEditorHtml } from "../editor.js";
import { listMusicas, getMusica } from "../services/musicas-service.js";
import { getCifra, saveCifra, findDuplicateCifraTitle, removeCifra } from "../services/cifras-service.js";
import { explainFirebaseError } from "../db.js";

const params = new URLSearchParams(window.location.search);
const cifraId = params.get("id") || "";
let selectedMusicaId = "";

async function renderMusicaSearch(term = "") {
  const box = document.getElementById("cifra-musica-resultados");
  if (!box) return;

  const all = await listMusicas(true);
  const filtered = all
    .filter((item) => String(item.title || "").toLowerCase().includes(String(term || "").trim().toLowerCase()))
    .slice(0, 8);

  box.innerHTML = filtered.map((item) => `
    <button type="button" class="button-outline" data-musica-id="${item.id}" data-musica-title="${item.title}">
      ${item.title}
    </button>
  `).join("");

  box.querySelectorAll("[data-musica-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMusicaId = button.dataset.musicaId;
      document.getElementById("cifra-musica-search").value = button.dataset.musicaTitle;
      box.innerHTML = `<p>Música vinculada: <strong>${button.dataset.musicaTitle}</strong></p>`;
    });
  });
}

function waitForCifraEditor(timeout = 5000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (window.tinymce?.get("cifra-conteudo")) {
        resolve(true);
        return;
      }
      if (Date.now() - started > timeout) {
        resolve(false);
        return;
      }
      setTimeout(tick, 120);
    };
    tick();
  });
}

async function loadCifraIfEditing() {
  if (!cifraId) {
    await renderMusicaSearch("");
    return;
  }

  const cifra = await getCifra(cifraId);
  if (!cifra) {
    await renderMusicaSearch("");
    return;
  }

  selectedMusicaId = cifra.musicaId || "";
  document.getElementById("cifra-musica-search").value = cifra.title || "";
  document.getElementById("cifra-tom").value = cifra.originalKey || cifra.tonality || cifra.tom || "";
  document.getElementById("cifra-capo").value = cifra.capo || "";
  document.getElementById("cifra-bpm").value = cifra.bpm || "";

  await waitForCifraEditor();
  setCifraEditorHtml(String(cifra.cifraHtml || cifra.cifraText || "").replace(/\r\n?/g, "\n"));

  const box = document.getElementById("cifra-musica-resultados");
  if (box && cifra.title) {
    box.innerHTML = `<p>Música vinculada: <strong>${cifra.title}</strong></p>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCifraIfEditing();

  document.getElementById("cifra-musica-search")?.addEventListener("input", async (event) => {
    selectedMusicaId = "";
    await renderMusicaSearch(event.target.value);
  });

  document.getElementById("admin-editor-cifra-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      if (!selectedMusicaId) {
        alert("Selecione uma música vinculada.");
        return;
      }

      const musica = await getMusica(selectedMusicaId);
      const title = musica?.title || document.getElementById("cifra-musica-search")?.value?.trim() || "";

      const duplicate = await findDuplicateCifraTitle(title, cifraId);
      if (duplicate) {
        const editExisting = confirm("Já existe uma cifra com esse título. Deseja editar a existente?");
        if (editExisting) {
          window.location.href = `./editor-cifra.html?id=${duplicate.id}`;
        }
        return;
      }

      const cifraText = getCifraEditorPlainText().replace(/\r\n?/g, "\n");
      const cifraHtml = getCifraEditorHtml();

      const payload = {
        musicaId: selectedMusicaId,
        title,
        subtitle: musica?.subtitle || "",
        cifraText,
        cifraHtml,
        originalKey: document.getElementById("cifra-tom")?.value?.trim() || "",
        capo: document.getElementById("cifra-capo")?.value?.trim() || "",
        bpm: document.getElementById("cifra-bpm")?.value?.trim() || "",
        active: true
      };

      await saveCifra(payload, cifraId);
      alert("✅ Cifra cadastrada com sucesso!");
      window.location.href = "./cifras.html";
    } catch (error) {
      console.error("Erro ao salvar cifra:", error);
      alert("Erro ao salvar cifra no Firebase.\n\n" + explainFirebaseError(error));
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  document.getElementById("delete-cifra-button")?.addEventListener("click", async () => {
    if (!cifraId) {
      alert("Esta cifra ainda não foi salva.");
      return;
    }

    try {
      if (!confirm("Deseja excluir esta cifra?")) return;
      await removeCifra(cifraId);
      alert("🗑️ Cifra excluída com sucesso!");
      window.location.href = "./cifras.html";
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir cifra no Firebase.\n\n" + explainFirebaseError(error));
    }
  });
});
