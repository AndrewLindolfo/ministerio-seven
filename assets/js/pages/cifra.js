import { getCifraBySlug, listCifras } from "../services/cifras-service.js";
import { getMusica } from "../services/musicas-service.js";
import { getQueryParam } from "../utils.js";
import { initCifraControls, setOriginalMetaTom } from "../modules/cifra-controls.js";

const CHORD_TOKEN_REGEX = /^[A-G](?:#|b)?(?:[A-Za-z0-9º+\-]*(?:\([^)]+\))?)?(?:\/[A-G](?:#|b)?)?$/;
const INTRO_LINE_REGEX = /^\s*\[Intro\]\s*$/i;
const INTRO_WITH_CHORDS_REGEX = /^\s*\[Intro\]\s+/i;

function stripHtmlToPlainText(html = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = String(html || "").replace(/\u00A0/g, " ");
  return (tmp.innerText || tmp.textContent || "").replace(/\r\n?/g, "\n");
}

function cleanToken(token = "") {
  return String(token || "")
    .trim()
    .replace(/^[\[\(\{'"`]+/, "")
    .replace(/[\]\)\}'"`.,;:!?]+$/, "");
}

function isChordToken(token = "") {
  return CHORD_TOKEN_REGEX.test(cleanToken(token));
}

function isChordOnlyLine(text = "") {
  const tokens = String(text || "")
    .trim()
    .split(/\s+/)
    .map(cleanToken)
    .filter(Boolean);
  if (!tokens.length) return false;
  return tokens.every(isChordToken);
}

function splitHtmlLines(html = "") {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = String(html || "");
  const lines = [];
  let current = [];

  wrapper.childNodes.forEach((node) => {
    if (node.nodeName === "BR") {
      lines.push(current);
      current = [];
    } else {
      current.push(node.cloneNode(true));
    }
  });
  lines.push(current);
  return lines;
}

function textFromNodes(nodes = []) {
  const tmp = document.createElement("div");
  nodes.forEach((node) => tmp.appendChild(node.cloneNode(true)));
  return String(tmp.textContent || "").replace(/\u00A0/g, " ");
}

function wrapChordLinesFromHtml(html = "") {
  const lines = splitHtmlLines(html);
  let introBlockRemaining = 0;

  return lines.map((nodes) => {
    const lineText = textFromNodes(nodes);
    const trimmed = lineText.trim();
    let shouldBold = false;

    if (INTRO_LINE_REGEX.test(trimmed)) {
      introBlockRemaining = 4;
    } else if (INTRO_WITH_CHORDS_REGEX.test(trimmed)) {
      shouldBold = true;
      introBlockRemaining = 4;
    } else if (introBlockRemaining > 0) {
      if (isChordOnlyLine(trimmed)) {
        shouldBold = true;
        introBlockRemaining -= 1;
      } else {
        introBlockRemaining = 0;
      }
    } else if (isChordOnlyLine(trimmed)) {
      shouldBold = true;
    }

    const tmp = document.createElement("div");
    nodes.forEach((node) => tmp.appendChild(node.cloneNode(true)));
    const inner = tmp.innerHTML || "";

    return shouldBold
      ? `<span class="cifra-chord-line">${inner}</span>`
      : inner;
  }).join("<br>");
}

function wrapChordLinesFromPlainText(text = "") {
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  let introBlockRemaining = 0;

  return lines.map((line) => {
    const trimmed = line.trim();
    let shouldBold = false;

    if (INTRO_LINE_REGEX.test(trimmed)) {
      introBlockRemaining = 4;
      return line;
    }

    if (INTRO_WITH_CHORDS_REGEX.test(trimmed)) {
      shouldBold = true;
      introBlockRemaining = 4;
    } else if (introBlockRemaining > 0) {
      if (isChordOnlyLine(trimmed)) {
        shouldBold = true;
        introBlockRemaining -= 1;
      } else {
        introBlockRemaining = 0;
      }
    } else if (isChordOnlyLine(trimmed)) {
      shouldBold = true;
    }

    const safe = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/ /g, "&nbsp;");

    return shouldBold
      ? `<span class="cifra-chord-line">${safe}</span>`
      : safe;
  }).join("<br>");
}

function ensurePrevNextNav() {
  let nav = document.querySelector(".prev-next-nav");
  if (nav) return nav;

  const container = document.querySelector(".cifra-page .container") || document.querySelector("main .container");
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
      ? `<a href="./cifra.html?slug=${previous.slug}" class="prev-link">← Anterior</a>`
      : `<span class="prev-link is-disabled">← Anterior</span>`}
    <span class="nav-divider"> | </span>
    ${next
      ? `<a href="./cifra.html?slug=${next.slug}" class="next-link">Próxima →</a>`
      : `<span class="next-link is-disabled">Próxima →</span>`}
  `;

  nav.querySelectorAll(".is-disabled").forEach((el) => {
    el.style.opacity = ".45";
    el.style.pointerEvents = "none";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const slug = getQueryParam("slug");
    const cifra = await getCifraBySlug(slug);

    const titleEl = document.getElementById("cifra-titulo");
    const subtitleEl = document.getElementById("cifra-subtitulo");
    const contentEl = document.getElementById("cifra-content");
    const letraLink = document.getElementById("ver-letra-link");

    if (!cifra) {
      if (titleEl) titleEl.textContent = "Cifra não encontrada";
      return;
    }

    if (titleEl) titleEl.textContent = cifra.title || "Título da cifra";

    if (subtitleEl) {
      subtitleEl.textContent = cifra.subtitle || "";
      subtitleEl.hidden = !cifra.subtitle;
    }

    const originalKey = cifra.originalKey || cifra.tonality || cifra.tom || "C";
    setOriginalMetaTom(originalKey, cifra.capo || "", cifra.bpm || "");

    const richHtml = String(cifra.cifraHtml || "").replace(/\r\n?/g, "\n");
    const plainText = String(cifra.cifraText || stripHtmlToPlainText(richHtml) || "").replace(/\r\n?/g, "\n");

    if (contentEl) {
      if (richHtml) {
        contentEl.innerHTML = wrapChordLinesFromHtml(richHtml);
        contentEl.dataset.originalHtml = richHtml;
      } else {
        contentEl.innerHTML = wrapChordLinesFromPlainText(plainText);
      }
      contentEl.dataset.originalText = plainText;
    }


    if (letraLink) {
      let musicaSlug = cifra.slug || "";
      if (cifra.musicaId) {
        const musica = await getMusica(cifra.musicaId);
        if (musica?.slug) musicaSlug = musica.slug;
      }

      if (musicaSlug) {
        letraLink.href = `./musica.html?slug=${musicaSlug}`;
        letraLink.textContent = "Ver letra";
      } else {
        letraLink.removeAttribute("href");
        letraLink.textContent = "Letra indisponível";
      }
    }


    const allCifras = await listCifras(true);
    renderPrevNext(cifra.slug, allCifras);

    initCifraControls();
  } catch (error) {
    console.error("Erro ao carregar cifra pública:", error);
    const titleEl = document.getElementById("cifra-titulo");
    if (titleEl) titleEl.textContent = "Erro ao carregar cifra";
  }
});
