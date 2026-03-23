import { setDocument } from "../db.js";
import { BACKUP_COLLECTIONS } from "./backup-service.js";

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function sanitizeForFirestore(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sanitizeForFirestore);
  if (isObject(value)) {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === "id") continue;
      out[key] = sanitizeForFirestore(val);
    }
    return out;
  }
  return value;
}

export async function restoreBackupJson(json) {
  if (!isObject(json)) {
    throw new Error("Arquivo de backup inválido.");
  }

  for (const collectionName of BACKUP_COLLECTIONS) {
    const items = json[collectionName];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item?.id) continue;
      const cleanData = sanitizeForFirestore(item);
      await setDocument(collectionName, item.id, cleanData, { merge: true });
    }
  }

  return true;
}
