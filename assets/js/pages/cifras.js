import { listCifras } from "../services/cifras-service.js";
import { renderAlphabetList, filterByTerm } from "../modules/alphabet-filter.js";

document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("cifras-filter-input");
  const containerId = "cifras-lista-alfabetica";
  renderAlphabetList(containerId, [], "Carregando cifras...");

  try {
    const all = (await listCifras(true)).map((item) => ({
      titulo: item.title,
      href: `./cifra.html?slug=${item.slug}`
    }));

    const render = (term = "") => {
      renderAlphabetList(containerId, filterByTerm(all, term), "Nenhuma cifra encontrada.");
    };

    render();
    input?.addEventListener("input", (event) => render(event.target.value));
  } catch (error) {
    console.error("Erro ao carregar cifras:", error);
    renderAlphabetList(containerId, [], "Não foi possível carregar as cifras.");
  }
});
