import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getCollection,
  getOneByField,
  serverTimestamp,
  slugify,
  normalizeText
} from "../db.js";

const COLLECTION = "cifras";
const CACHE_KEY = "seven_cache_cifras_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.items || !Array.isArray(parsed.items)) return null;
    if (Date.now() - Number(parsed.savedAt || 0) > CACHE_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      items
    }));
  } catch {}
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

function normalizeList(all = [], activeOnly = false) {
  return all
    .filter((item) => activeOnly ? item.active !== false : true)
    .sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "pt-BR"));
}

export async function listCifras(activeOnly = false) {
  const cached = readCache();
  if (cached) {
    return normalizeList(cached, activeOnly);
  }

  const all = await getCollection(COLLECTION);
  writeCache(all);
  return normalizeList(all, activeOnly);
}

export async function getCifra(id) {
  return await getDocument(COLLECTION, id);
}

export async function getCifraBySlug(slug) {
  return await getOneByField(COLLECTION, "slug", slug);
}

export async function findDuplicateCifraTitle(title, ignoreId = "") {
  const normalizedTitle = normalizeText(title);
  const all = await getCollection(COLLECTION);
  return all.find((item) => item.normalizedTitle === normalizedTitle && item.id !== ignoreId) || null;
}

export async function saveCifra(payload, id = "") {
  const title = String(payload.title || "").trim();
  const docData = {
    musicaId: payload.musicaId || "",
    title,
    slug: slugify(title),
    normalizedTitle: normalizeText(title),
    subtitle: payload.subtitle || "",
    cifraText: payload.cifraText || "",
    cifraHtml: payload.cifraHtml || "",
    originalKey: payload.originalKey || "",
    capo: payload.capo || "",
    bpm: payload.bpm || "",
    views: typeof payload.views === "number" ? payload.views : 0,
    active: payload.active !== false,
    updatedAt: serverTimestamp()
  };

  clearCache();

  if (id) {
    await updateDocument(COLLECTION, id, docData);
    return id;
  }

  docData.createdAt = serverTimestamp();
  return await addDocument(COLLECTION, docData);
}

export async function removeCifra(id) {
  clearCache();
  await deleteDocument(COLLECTION, id);
}
