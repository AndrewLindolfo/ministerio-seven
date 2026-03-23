import { listMusicas } from "../services/musicas-service.js";
import { renderAlphabetList, filterByTerm } from "../modules/alphabet-filter.js";

document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("musicas-filter-input");
  const containerId = "musicas-lista-alfabetica";
  renderAlphabetList(containerId, [], "Carregando músicas...");

  try {
    const all = (await listMusicas(true)).map((item) => ({
      titulo: item.title,
      href: `./musica.html?slug=${item.slug}`
    }));

    const render = (term = "") => {
      renderAlphabetList(containerId, filterByTerm(all, term), "Nenhuma música encontrada.");
    };

    render();
    input?.addEventListener("input", (event) => render(event.target.value));
  } catch (error) {
    console.error("Erro ao carregar músicas:", error);
    renderAlphabetList(containerId, [], "Não foi possível carregar as músicas.");
  }
});
