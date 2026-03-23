import { getMusicaBySlug, listMusicas } from "../services/musicas-service.js";
import { getCifraBySlug } from "../services/cifras-service.js";
import { getQueryParam } from "../utils.js";
import { initMusicaControls } from "../modules/musica-controls.js";

function buildYoutubeEmbedUrl(raw = "") {
  const value = String(raw || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIndex + 1]}`;
      }
      if (parts[0] === "shorts" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
    }

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace(/^\/+/, "").split("/")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (error) {
    return "";
  }

  return "";
}

function escapeHtml(text = "") {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ensurePrevNextNav() {
  let nav = document.querySelector(".prev-next-nav");
  if (nav) return nav;

  const container = document.querySelector(".musica-page .container") || document.querySelector("main .container");
  if (!container) return null;

  nav = document.createElement("nav");
  nav.className = "prev-next-nav";
  container.appendChild(nav);
  return nav;
}

function renderPrevNext(currentSlug = "", items = []) {
  const nav = ensurePrevNextNav();
  if (!nav || !items.length) return;

  const currentIndex = items.findIndex((item) => String(item.slug || "") === String(currentSlug || ""));
  if (currentIndex === -1) {
    nav.innerHTML = "";
    return;
  }

  const previous = currentIndex > 0 ? items[currentIndex - 1] : null;
  const next = currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

  nav.innerHTML = `
    ${previous
      ? `<a href="./musica.html?slug=${previous.slug}" class="prev-link">← Anterior</a>`
      : `<span class="prev-link is-disabled">← Anterior</span>`}
    <span class="nav-divider"> | </span>
    ${next
      ? `<a href="./musica.html?slug=${next.slug}" class="next-link">Próxima →</a>`
      : `<span class="next-link is-disabled">Próxima →</span>`}
  `;

  nav.querySelectorAll(".is-disabled").forEach((el) => {
    el.style.opacity = ".45";
    el.style.pointerEvents = "none";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const slug = getQueryParam("slug");
  const musica = await getMusicaBySlug(slug);

  if (!musica) {
    const title = document.getElementById("musica-titulo");
    if (title) title.textContent = "Música não encontrada";
    return;
  }

  document.getElementById("musica-titulo").textContent = musica.title || "";

  const subtitle = document.getElementById("musica-subtitulo");
  if (subtitle) {
    subtitle.textContent = musica.subtitle || "";
    subtitle.hidden = !musica.subtitle;
  }

  const parts = [];
  if (musica.author) parts.push(`Autor: ${escapeHtml(musica.author)}`);
  if (musica.originalKey) parts.push(`Tom: ${escapeHtml(musica.originalKey)}`);
  if (musica.category) parts.push(`Categoria: ${escapeHtml(musica.category)}`);
  const meta = document.getElementById("musica-meta");
  if (meta) meta.innerHTML = parts.join(" | ");

  const letra = document.getElementById("musica-letra");
  if (letra) letra.innerHTML = musica.lyricHtml || "";

  const cifra = await getCifraBySlug(musica.slug);
  const cross = document.getElementById("ver-cifra-link");
  if (cross) {
    if (cifra) {
      cross.href = `./cifra.html?slug=${cifra.slug}`;
      cross.textContent = "Ver cifra";
    } else {
      cross.textContent = "Cifra em breve";
      cross.removeAttribute("href");
      cross.style.pointerEvents = "none";
      cross.style.opacity = ".6";
    }
  }

  const videoBox = document.getElementById("musica-video-wrapper");
  const embedUrl = buildYoutubeEmbedUrl(musica.youtubeUrl || musica.youtube || "");
  if (videoBox) {
    if (embedUrl) {
      videoBox.innerHTML = `
        <iframe
          src="${embedUrl}"
          title="Vídeo da música"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen>
        </iframe>
      `;
    } else {
      videoBox.innerHTML = "";
    }
  }

  const allMusicas = await listMusicas(true);
  renderPrevNext(musica.slug, allMusicas);

  initMusicaControls();
});
