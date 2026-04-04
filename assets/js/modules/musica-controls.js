import { exportMusicaPdf } from "../pdf.js";

const FONT_KEY = "seven_musica_font";
const FOCUS_KEY = "seven_musica_focus";
const SPEED_KEY = "seven_musica_scroll_speed";
const SCROLL_PANEL_VISIBLE_KEY = "seven_musica_scroll_panel_visible";
const SCROLL_PANEL_POS_KEY = "seven_musica_scroll_panel_pos";

const SPEED_STEPS = [0.08, 0.18, 0.35, 0.7, 1.2];

let scrollInterval = null;
let scrollSpeed = Number(localStorage.getItem(SPEED_KEY) || "0.35");
let scrollAccumulator = 0;

function $(selector) {
  return document.querySelector(selector);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getContent() {
  return $("#musica-letra") ||
         $(".musica-content") ||
         document.querySelector("article.musica-content") ||
         document.querySelector(".musica-page article");
}

function getStoredScrollPanelPos() {
  try {
    return JSON.parse(localStorage.getItem(SCROLL_PANEL_POS_KEY) || "null");
  } catch {
    return null;
  }
}

function saveScrollPanelPos(pos) {
  localStorage.setItem(SCROLL_PANEL_POS_KEY, JSON.stringify(pos));
}

function isScrollPanelVisible() {
  return localStorage.getItem(SCROLL_PANEL_VISIBLE_KEY) === "1";
}

function nearestSpeedIndex(value) {
  let idx = 0;
  let diff = Infinity;
  SPEED_STEPS.forEach((step, i) => {
    const d = Math.abs(step - value);
    if (d < diff) {
      diff = d;
      idx = i;
    }
  });
  return idx;
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
    <button type="button" id="scroll-panel-toggle" class="scroll-panel-toggle-btn" aria-label="Mostrar ou ocultar auto-rolamento" title="Mostrar ou ocultar auto-rolamento">
      <span class="scroll-panel-toggle-icon" aria-hidden="true"></span>
    </button>
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

function ensureScrollBubble() {
  let bubble = document.getElementById("scroll-bubble");
  if (bubble) return bubble;
  bubble = document.createElement("div");
  bubble.className = "scroll-bubble";
  bubble.id = "scroll-bubble";
  bubble.setAttribute("aria-hidden", "true");
  bubble.hidden = true;
  bubble.innerHTML = `
    <button type="button" id="scroll-bubble-close" class="scroll-bubble-close" aria-label="Fechar auto-rolamento" title="Fechar auto-rolamento">✕</button>
    <button type="button" id="scroll-slower" aria-label="Diminuir velocidade">-</button>
    <button type="button" id="scroll-toggle" aria-label="Iniciar ou pausar rolagem">▶</button>
    <button type="button" id="scroll-faster" aria-label="Aumentar velocidade">+</button>
  `;
  document.querySelector("main.musica-page")?.appendChild(bubble) || document.body.appendChild(bubble);
  return bubble;
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

function ensureSpeedLabel() {
  const bubble = ensureScrollBubble();
  if (!bubble) return null;
  let label = document.getElementById("scroll-speed-label");
  if (!label) {
    label = document.createElement("span");
    label.id = "scroll-speed-label";
    const slowerBtn = $("#scroll-slower");
    if (slowerBtn) slowerBtn.insertAdjacentElement("afterend", label);
  }
  return label;
}

function updateScrollButton(isRunning) {
  const btn = $("#scroll-toggle");
  if (btn) btn.textContent = isRunning ? "⏸" : "▶";
}

function updateSpeedIndicator() {
  const label = ensureSpeedLabel();
  if (label) {
    const level = nearestSpeedIndex(scrollSpeed) + 1;
    label.textContent = "";
    label.dataset.level = String(level);
    label.setAttribute("aria-label", `Velocidade ${level} de ${SPEED_STEPS.length}`);
    label.title = `Velocidade ${level} de ${SPEED_STEPS.length}`;
  }
}

function initMobileScrollBar() {
  const bubble = ensureScrollBubble();
  if (!bubble) return;

  const isMobileOrTablet = window.innerWidth <= 1024;
  bubble.classList.toggle("is-mobile-scroll-bar", isMobileOrTablet);
  bubble.classList.toggle("mobile-scroll-bar", isMobileOrTablet);
  bubble.classList.toggle("is-mobile-bar", isMobileOrTablet);

  let slider = bubble.querySelector(".mobile-scroll-slider");
  if (!slider) {
    slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0.08";
    slider.max = "1.20";
    slider.step = "0.01";
    slider.className = "mobile-scroll-slider";
    slider.setAttribute("aria-label", "Velocidade da rolagem");
    const toggleBtn = $("#scroll-toggle");
    if (toggleBtn) bubble.insertBefore(slider, toggleBtn);
    else bubble.appendChild(slider);

    slider.addEventListener("input", () => {
      scrollSpeed = Number(slider.value || "0.35");
      localStorage.setItem(SPEED_KEY, String(scrollSpeed));
      updateSpeedIndicator();
    });
  }

  slider.value = String(scrollSpeed);
}

function applyScrollPanelPos() {
  const bubble = ensureScrollBubble();
  if (!bubble) return;

  if (window.innerWidth <= 1024) {
    bubble.style.left = "";
    bubble.style.top = "";
    bubble.style.right = "";
    bubble.style.bottom = "";
    return;
  }

  const stored = getStoredScrollPanelPos();
  if (!stored || typeof stored.left !== "number" || typeof stored.top !== "number") {
    bubble.style.left = "";
    bubble.style.top = "";
    bubble.style.right = "8px";
    bubble.style.bottom = "8px";
    return;
  }

  const maxLeft = Math.max(4, window.innerWidth - bubble.offsetWidth - 4);
  const maxTop = Math.max(4, window.innerHeight - bubble.offsetHeight - 4);

  bubble.style.left = `${clamp(stored.left, 4, maxLeft)}px`;
  bubble.style.top = `${clamp(stored.top, 4, maxTop)}px`;
  bubble.style.right = "auto";
  bubble.style.bottom = "auto";
}

function setScrollPanelVisible(visible) {
  const bubble = ensureScrollBubble();
  const toggleBtn = $("#scroll-panel-toggle");
  if (!bubble) return;

  bubble.hidden = !visible;
  bubble.classList.toggle("is-hidden", !visible);
  bubble.classList.toggle("is-open", visible);
  bubble.setAttribute("aria-hidden", visible ? "false" : "true");
  localStorage.setItem(SCROLL_PANEL_VISIBLE_KEY, visible ? "1" : "0");

  if (toggleBtn) toggleBtn.classList.toggle("is-active", visible);
  if (visible) requestAnimationFrame(() => applyScrollPanelPos());
  requestAnimationFrame(() => {
    const controls = $(".musica-top-controls");
    if (controls && window.innerWidth <= 1024) {
      controls.classList.remove("controls-hidden");
    }
  });

  if (!visible && scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
    scrollAccumulator = 0;
    updateScrollButton(false);
  }
}

function toggleScrollPanel() {
  setScrollPanelVisible(!isScrollPanelVisible());
}

function initScrollPanelDrag() {
  if (window.innerWidth <= 1024) return;
  const bubble = ensureScrollBubble();
  if (!bubble || bubble.dataset.dragReady === "1") return;
  bubble.dataset.dragReady = "1";

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const begin = (clientX, clientY) => {
    const rect = bubble.getBoundingClientRect();
    dragging = true;
    startX = clientX;
    startY = clientY;
    startLeft = rect.left;
    startTop = rect.top;
    bubble.classList.add("is-dragging");
    bubble.style.right = "auto";
    bubble.style.bottom = "auto";
    bubble.style.left = `${rect.left}px`;
    bubble.style.top = `${rect.top}px`;
  };

  const move = (clientX, clientY) => {
    if (!dragging) return;
    const maxLeft = Math.max(4, window.innerWidth - bubble.offsetWidth - 4);
    const maxTop = Math.max(4, window.innerHeight - bubble.offsetHeight - 4);
    bubble.style.left = `${clamp(startLeft + (clientX - startX), 4, maxLeft)}px`;
    bubble.style.top = `${clamp(startTop + (clientY - startY), 4, maxTop)}px`;
  };

  const end = () => {
    if (!dragging) return;
    dragging = false;
    bubble.classList.remove("is-dragging");
    saveScrollPanelPos({
      left: parseFloat(bubble.style.left) || bubble.getBoundingClientRect().left,
      top: parseFloat(bubble.style.top) || bubble.getBoundingClientRect().top
    });
  };

  bubble.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button") || event.target.closest("input")) return;
    event.preventDefault();
    begin(event.clientX, event.clientY);
  });

  window.addEventListener("pointermove", (event) => move(event.clientX, event.clientY));
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);

  window.addEventListener("resize", () => {
    initMobileScrollBar();
    initResponsiveControlsAutoHide();
    if (isScrollPanelVisible()) applyScrollPanelPos();
  });
}

function initResponsiveControlsAutoHide() {
  const controls = $(".musica-top-controls");
  if (!controls || controls.dataset.autoHideReady === "1") return;
  controls.dataset.autoHideReady = "1";

  let lastY = window.scrollY || 0;
  let ticking = false;
  const MOBILE_MAX = 1024;
  const DELTA = 10;

  const apply = () => {
    ticking = false;
    const isMobileOrTablet = window.innerWidth <= MOBILE_MAX;
    const scrollPanelOpen = isScrollPanelVisible();

    if (!isMobileOrTablet) {
      controls.classList.remove("controls-hidden");
      lastY = window.scrollY || 0;
      return;
    }

    if (scrollPanelOpen) {
      controls.classList.remove("controls-hidden");
      lastY = window.scrollY || 0;
      return;
    }

    const currentY = window.scrollY || 0;
    const diff = currentY - lastY;

    if (currentY <= 12) {
      controls.classList.remove("controls-hidden");
    } else if (diff > DELTA) {
      controls.classList.add("controls-hidden");
      lastY = currentY;
      return;
    } else if (diff < -DELTA) {
      controls.classList.remove("controls-hidden");
      lastY = currentY;
      return;
    }

    lastY = currentY;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(apply);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_MAX) {
      controls.classList.remove("controls-hidden");
    } else {
      apply();
    }
  }, { passive: true });

  apply();
}

export function changeMusicaScrollSpeed(delta = 1) {
  const idx = nearestSpeedIndex(scrollSpeed);
  const nextIdx = Math.max(0, Math.min(SPEED_STEPS.length - 1, idx + delta));
  scrollSpeed = SPEED_STEPS[nextIdx];
  localStorage.setItem(SPEED_KEY, String(scrollSpeed));
  updateSpeedIndicator();
  const slider = document.querySelector(".mobile-scroll-slider");
  if (slider) slider.value = String(scrollSpeed);
}

function reachedEnd() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return window.scrollY >= maxScroll - 2;
}

export function toggleMusicaScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
    scrollAccumulator = 0;
    updateScrollButton(false);
    return;
  }

  scrollInterval = window.setInterval(() => {
    if (reachedEnd()) {
      clearInterval(scrollInterval);
      scrollInterval = null;
      scrollAccumulator = 0;
      updateScrollButton(false);
      return;
    }
    scrollAccumulator += scrollSpeed;
    const pixels = Math.floor(scrollAccumulator);
    if (pixels >= 1) {
      window.scrollBy({ top: pixels, left: 0, behavior: "auto" });
      scrollAccumulator -= pixels;
    }
  }, 20);

  updateScrollButton(true);
}

export function initMusicaControls() {
  if (localStorage.getItem(SCROLL_PANEL_VISIBLE_KEY) === null) {
    localStorage.setItem(SCROLL_PANEL_VISIBLE_KEY, "0");
  }

  ensureMusicaControls();
  ensureScrollBubble();
  ensureSpeedLabel();
  initMobileScrollBar();
  initScrollPanelDrag();
  initResponsiveControlsAutoHide();
  applySavedFont();
  applySavedFocus();

  $("#musica-font-up")?.addEventListener("click", increaseMusicaFont);
  $("#musica-font-down")?.addEventListener("click", decreaseMusicaFont);
  $("#musica-focus-toggle")?.addEventListener("click", toggleMusicaFocusMode);
  $("#musica-fullscreen-toggle")?.addEventListener("click", toggleMusicaFullscreen);
  $("#scroll-panel-toggle")?.addEventListener("click", toggleScrollPanel);
  $("#musica-pdf-toggle")?.addEventListener("click", exportMusicaPdf);
  $("#scroll-faster")?.addEventListener("click", () => changeMusicaScrollSpeed(1));
  $("#scroll-slower")?.addEventListener("click", () => changeMusicaScrollSpeed(-1));
  $("#scroll-toggle")?.addEventListener("click", toggleMusicaScroll);
  $("#scroll-bubble-close")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setScrollPanelVisible(false);
  });

  updateScrollButton(false);
  updateSpeedIndicator();
  if (window.innerWidth <= 1024) {
    setScrollPanelVisible(false);
  } else {
    setScrollPanelVisible(isScrollPanelVisible());
  }
}
