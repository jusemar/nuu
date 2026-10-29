import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/connection";
import { productGalleryImagesTable } from "@/db/schema";
import {
  armazenamentoImagemEhLocal,
  lerImagemRepresentanteLocal,
} from "@/features/products/actions/representantes/armazenar-imagem-produto";
import { exigirLeituraProdutoAdmin } from "@/features/products/queries/autorizacao/escopo-produtos-admin";

/** Somente mídia local de desenvolvimento; o pai é autorizado antes de ler o arquivo. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imagemId: string }> },
) {
  if (!armazenamentoImagemEhLocal()) return new Response(null, { status: 404 });
  try {
    const id = z.uuid().parse((await params).imagemId);
    const [imagem] = await db
      .select({ produtoId: productGalleryImagesTable.productId })
      .from(productGalleryImagesTable)
      .where(
        eq(
          productGalleryImagesTable.imageUrl,
          `/api/imagens-representante-local/${id}`,
        ),
      )
      .limit(1);
    if (!imagem) return new Response(null, { status: 404 });
    await exigirLeituraProdutoAdmin(imagem.produtoId);
    const bytes = await lerImagemRepresentanteLocal(id);
    const tipo =
      bytes[0] === 137
        ? "image/png"
        : bytes[0] === 255
          ? "image/jpeg"
          : "image/webp";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": tipo,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
