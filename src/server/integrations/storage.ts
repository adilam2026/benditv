// Service de stockage de médias abstrait.
// Développement : stockage local dans public/uploads.
// Production : la même interface peut être implémentée vers S3 ou un
// service compatible. Les métadonnées EXIF ne sont pas conservées
// (les fichiers sont ré-encodés côté client ou tronqués aux octets
// d'image ; la position GPS n'est jamais stockée).

import { createHash } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type StoredFile = { url: string; hash: string };

export async function storeImage(file: File): Promise<StoredFile> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Format non autorisé (JPEG, PNG ou WebP uniquement).");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Fichier trop volumineux (5 Mo maximum).");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${hash.slice(0, 24)}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return { url: `/uploads/${name}`, hash };
}

export async function deleteImage(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(UPLOAD_DIR, path.basename(url)));
  } catch {
    // déjà supprimé
  }
}
