import { getCollection } from "../db.js";

export const BACKUP_COLLECTIONS = [
  "admins",
  "musicas",
  "cifras",
  "programacoes",
  "albuns",
  "downloads",
  "contatos",
  "links",
  "config"
];

function sanitizeForJson(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === "function") continue;
      out[key] = sanitizeForJson(val);
    }
    return out;
  }
  return value;
}

export async function exportBackupJson() {
  const result = {
    _meta: {
      app: "Ministerio Seven",
      version: 1,
      exportedAt: new Date().toISOString(),
      collections: [...BACKUP_COLLECTIONS]
    }
  };

  for (const name of BACKUP_COLLECTIONS) {
    const items = await getCollection(name);
    result[name] = sanitizeForJson(items);
  }

  return result;
}
