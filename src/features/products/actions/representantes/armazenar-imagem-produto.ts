import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { del, put } from "@vercel/blob";

const pastaLocal = "/tmp/nooo-imagens-representantes";
/** O desenvolvimento nunca usa o token Blob real para ensaiar uploads. */
export function armazenamentoImagemEhLocal() {
  try {
    return (
      process.env.NOOO_BANCO === "local" &&
      ["localhost", "127.0.0.1"].includes(
        new URL(process.env.DATABASE_URL ?? "").hostname,
      )
    );
  } catch {
    return false;
  }
}
export function validarImagemRepresentante(bytes: Uint8Array, tipo: string) {
  if (!bytes.length || bytes.length > 4 * 1024 * 1024)
    throw new Error("A imagem deve ter até 4 MB.");
  const png =
    tipo === "image/png" &&
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71;
  const jpeg =
    tipo === "image/jpeg" &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255;
  const webp =
    tipo === "image/webp" &&
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP";
  if (!png && !jpeg && !webp)
    throw new Error("Envie uma imagem JPG, PNG ou WebP válida.");
  return png ? "png" : jpeg ? "jpg" : "webp";
}
export async function armazenarImagemRepresentante(
  produtoId: string,
  bytes: Uint8Array,
  tipo: string,
) {
  const extensao = validarImagemRepresentante(bytes, tipo);
  const id = randomUUID();
  if (armazenamentoImagemEhLocal()) {
    await mkdir(pastaLocal, { recursive: true });
    await writeFile(join(pastaLocal, id), bytes, { flag: "wx" });
    return {
      url: `/api/imagens-representante-local/${id}`,
      excluir: () => unlink(join(pastaLocal, id)),
    };
  }
  if (process.env.NODE_ENV !== "production")
    throw new Error(
      "Configure o banco e o armazenamento locais para enviar imagens.",
    );
  const blob = await put(
    `products/${produtoId}/${id}.${extensao}`,
    Buffer.from(bytes),
    { access: "public", contentType: tipo, addRandomSuffix: false },
  );
  return { url: blob.url, excluir: () => del(blob.url) };
}
export async function lerImagemRepresentanteLocal(id: string) {
  return readFile(join(pastaLocal, id));
}
