import { exportMusicaPdf } from "../pdf.js";

const FONT_KEY = "seven_musica_font";
const FOCUS_KEY = "seven_musica_focus";

function $(selector) {
  return document.querySelector(selector);
}

function getContent() {
  return $("#musica-letra") ||
         $(".musica-content") ||
         document.querySelector("article.musica-content") ||
         document.querySelector(".musica-page article");
}

function ensureMusicaControls() {
  if (document.getElementById("musica-top-controls")) return;

  const page = document.querySelector(".musica-page .container") ||
               document.querySelector(".musica-page section.container") ||
               document.querySelector("main.musica-page .container") ||
               document.querySelector("main .container");

  const anchor = document.getElementById("ver-cifra-link")?.closest(".page-cross-link") ||
                 document.querySelector(".page-cross-link") ||
                 document.getElementById("musica-meta");

  if (!page) return;

  const controls = document.createElement("div");
  controls.id = "musica-top-controls";
  controls.className = "musica-top-controls cifra-top-controls";
  controls.innerHTML = `
    <button type="button" id="musica-font-down">A-</button>
    <button type="button" id="musica-font-up">A+</button>
    <button type="button" id="musica-focus-toggle" aria-label="Modo foco">👁</button>
    <button type="button" id="musica-fullscreen-toggle" aria-label="Tela cheia">⛶</button>
    <button type="button" id="musica-pdf-toggle" class="pdf-modern-btn" aria-label="Baixar PDF" title="Baixar PDF">
      <span class="pdf-btn-icon">⤓</span>
      <span class="pdf-btn-label">PDF</span>
    </button>
  `;

  if (anchor) {
    anchor.insertAdjacentElement("afterend", controls);
  } else {
    const content = getContent();
    if (content && content.parentNode) {
      content.parentNode.insertBefore(controls, content);
    } else {
      page.appendChild(controls);
    }
  }
}

function applyFontStyles(size) {
  const el = getContent();
  if (!el) return;

  el.style.fontSize = `${size}px`;
  el.style.lineHeight = "1.5";

  el.querySelectorAll("*").forEach((node) => {
    node.style.fontSize = "inherit";
    node.style.lineHeight = "inherit";
  });
}

export function increaseMusicaFont() {
  const size = Number(localStorage.getItem(FONT_KEY) || "20") + 2;
  localStorage.setItem(FONT_KEY, String(size));
  applyFontStyles(size);
}

export function decreaseMusicaFont() {
  const size = Math.max(12, Number(localStorage.getItem(FONT_KEY) || "20") - 2);
  localStorage.setItem(FONT_KEY, String(size));
  applyFontStyles(size);
}

function applySavedFont() {
  const size = Number(localStorage.getItem(FONT_KEY) || "20");
  applyFontStyles(size);
}

export function toggleMusicaFocusMode() {
  document.body.classList.toggle("focus-mode");
  const active = document.body.classList.contains("focus-mode");
  localStorage.setItem(FOCUS_KEY, active ? "1" : "0");
  document.querySelector(".site-header")?.classList.toggle("hidden", active);
  document.querySelector(".site-footer")?.classList.toggle("hidden", active);
}

function applySavedFocus() {
  const active = localStorage.getItem(FOCUS_KEY) === "1";
  if (active) {
    document.body.classList.add("focus-mode");
    document.querySelector(".site-header")?.classList.add("hidden");
    document.querySelector(".site-footer")?.classList.add("hidden");
  }
}

export function toggleMusicaFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

export function initMusicaControls() {
  ensureMusicaControls();
  applySavedFont();
  applySavedFocus();

  $("#musica-font-up")?.addEventListener("click", increaseMusicaFont);
  $("#musica-font-down")?.addEventListener("click", decreaseMusicaFont);
  $("#musica-focus-toggle")?.addEventListener("click", toggleMusicaFocusMode);
  $("#musica-fullscreen-toggle")?.addEventListener("click", toggleMusicaFullscreen);
  $("#musica-pdf-toggle")?.addEventListener("click", exportMusicaPdf);
}
