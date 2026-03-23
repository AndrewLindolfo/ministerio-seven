const TINYMCE_SRC = "/assets/vendor/tinymce/js/tinymce/tinymce.min.js";

function loadTinyMCE() {
  return new Promise((resolve, reject) => {
    if (window.tinymce) {
      resolve(window.tinymce);
      return;
    }

    const existing = document.querySelector('script[data-tinymce-loader="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.tinymce), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TINYMCE_SRC;
    script.async = true;
    script.dataset.tinymceLoader = "true";
    script.onload = () => resolve(window.tinymce);
    script.onerror = () => reject(new Error("Não foi possível carregar o TinyMCE local."));
    document.head.appendChild(script);
  });
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeCifraPlainText(raw = "") {
  return String(raw || "")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "    ");
}

function plainToCifraHtml(text = "") {
  return normalizeCifraPlainText(text)
    .split("\n")
    .map((line) => escapeHtml(line).replace(/ /g, "&nbsp;"))
    .join("<br>");
}

function htmlToPlainCifra(editor) {
  const body = editor?.getBody?.();
  if (!body) return "";
  return normalizeCifraPlainText(body.innerText || body.textContent || "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

function normalizeRichCifraHtml(html = "") {
  return String(html || "").replace(/\r\n?/g, "\n").trim();
}

function preserveCifraSpacingHtml(rawHtml = "") {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = normalizeRichCifraHtml(rawHtml);

  const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let current;
  while ((current = walker.nextNode())) {
    textNodes.push(current);
  }

  textNodes.forEach((node) => {
    const value = String(node.nodeValue || "")
      .replace(/\t/g, "\u00A0\u00A0\u00A0\u00A0")
      .replace(/ /g, "\u00A0");
    node.nodeValue = value;
  });

  return wrapper.innerHTML;
}

async function initMusicaEditor() {
  const textarea = document.getElementById("musica-letra");
  if (!textarea || !window.tinymce) return;

  const existing = window.tinymce.get("musica-letra");
  if (existing) existing.remove();

  const initialValue = textarea.dataset.initialValue || textarea.value || "";

  await window.tinymce.init({
    selector: "#musica-letra",
    license_key: "gpl",
    height: 340,
    menubar: true,
    promotion: false,
    branding: false,
    plugins: "lists link code table fullscreen preview searchreplace visualblocks",
    toolbar:
      "undo redo | blocks fontfamily fontsize | bold italic underline forecolor backcolor | " +
      "alignleft aligncenter alignright alignjustify | bullist numlist | link table | code fullscreen preview",
    content_style: `
      body {
        font-family: Arial, sans-serif;
        font-size: 16px;
        line-height: 1.7;
        padding: 12px;
      }
      p, div {
        margin: 0 !important;
      }
    `,
    setup(editor) {
      editor.on("init", () => {
        if (initialValue) editor.setContent(initialValue);
      });
      editor.on("change input undo redo", () => {
        textarea.value = editor.getContent();
      });
    }
  });
}

async function initCifraEditor() {
  const textarea = document.getElementById("cifra-conteudo");
  if (!textarea || !window.tinymce) return;

  const existing = window.tinymce.get("cifra-conteudo");
  if (existing) existing.remove();

  const initialValue = textarea.dataset.initialValue || textarea.value || "";

  await window.tinymce.init({
    selector: "#cifra-conteudo",
    license_key: "gpl",
    height: 340,
    menubar: true,
    promotion: false,
    branding: false,
    forced_root_block: false,
    paste_as_text: false,
    entity_encoding: "named",
    verify_html: false,
    plugins: "code fullscreen preview searchreplace visualblocks textcolor nonbreaking",
    toolbar: "undo redo | bold italic underline forecolor backcolor | code fullscreen preview",
    content_style: `
      body {
        font-family: "Courier New", Courier, monospace;
        font-size: 16px;
        line-height: 1.45;
        white-space: pre-wrap;
        tab-size: 4;
        -moz-tab-size: 4;
        padding: 12px;
      }
      pre, p, div, span {
        font-family: "Courier New", Courier, monospace !important;
        white-space: pre-wrap !important;
        margin: 0 !important;
      }
    `,
    setup(editor) {
      editor.on("init", () => {
        if (initialValue) editor.setContent(initialValue);
      });

      const syncTextarea = () => {
        textarea.value = preserveCifraSpacingHtml(editor.getContent({ format: "raw" }));
      };

      editor.on("change input undo redo keyup paste SetContent", syncTextarea);
      editor.on("init", syncTextarea);
    }
  });
}

export function setCifraEditorPlainText(text = "") {
  const normalized = normalizeCifraPlainText(text);
  const html = plainToCifraHtml(normalized);
  const textarea = document.getElementById("cifra-conteudo");
  if (textarea) {
    textarea.value = html;
    textarea.dataset.initialValue = html;
  }

  const editor = window.tinymce?.get("cifra-conteudo");
  if (editor) {
    editor.setContent(html);
  }
}

export function setCifraEditorHtml(html = "") {
  const normalized = preserveCifraSpacingHtml(html);
  const textarea = document.getElementById("cifra-conteudo");
  if (textarea) {
    textarea.value = normalized;
    textarea.dataset.initialValue = normalized;
  }

  const editor = window.tinymce?.get("cifra-conteudo");
  if (editor) {
    editor.setContent(normalized);
  }
}

export function getCifraEditorPlainText() {
  const editor = window.tinymce?.get("cifra-conteudo");
  if (editor) return htmlToPlainCifra(editor);
  const textarea = document.getElementById("cifra-conteudo");
  const tmp = document.createElement("div");
  tmp.innerHTML = textarea?.value || "";
  return normalizeCifraPlainText(tmp.innerText || tmp.textContent || textarea?.value || "");
}

export function getCifraEditorHtml() {
  const editor = window.tinymce?.get("cifra-conteudo");
  if (editor) return preserveCifraSpacingHtml(editor.getContent({ format: "raw" }));
  return preserveCifraSpacingHtml(document.getElementById("cifra-conteudo")?.value || "");
}

export async function initSevenEditors() {
  await loadTinyMCE();

  if (document.getElementById("musica-letra")) {
    await initMusicaEditor();
  }

  if (document.getElementById("cifra-conteudo")) {
    await initCifraEditor();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initSevenEditors();
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar o editor TinyMCE local.");
  }
});
