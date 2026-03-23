import { listMusicas } from "../services/musicas-service.js";
import { getSiteConfig } from "../services/config-service.js";
import { renderProgramacaoCard } from "../modules/programacao-card.js";

async function renderSevenPhoto() {
  try {
    const config = await getSiteConfig();
    const sevenPhotoSection = document.getElementById("seven-photo-section");
    const sevenPhotoCard = document.getElementById("seven-photo-card");

    if (config?.sevenPhotoUrl && sevenPhotoSection && sevenPhotoCard) {
      sevenPhotoSection.hidden = false;
      sevenPhotoCard.innerHTML = `<img src="${config.sevenPhotoUrl}" alt="Ministério Seven" />`;
    }
  } catch (error) {
    console.error("Erro ao carregar foto principal:", error);
  }
}

async function renderDestaques() {
  const destaquesGrid = document.getElementById("destaques-grid");
  if (!destaquesGrid) return;

  try {
    const musicas = await listMusicas(true);
    const top = [...musicas]
      .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
      .slice(0, 5);

    destaquesGrid.innerHTML = top.length
      ? top.map((item, idx) => `
        <div class="destaque-box">
          <strong>#${idx + 1}</strong>
          <p>${item.title || ""}</p>
        </div>
      `).join("")
      : '<div class="destaque-box"><p>Nenhum destaque disponível.</p></div>';
  } catch (error) {
    console.error("Erro ao carregar destaques:", error);
    destaquesGrid.innerHTML = '<div class="destaque-box"><p>Nenhum destaque disponível.</p></div>';
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderSevenPhoto();
  await renderProgramacaoCard();
  await renderDestaques();
});
