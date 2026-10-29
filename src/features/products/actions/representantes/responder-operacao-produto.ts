import "server-only";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { ErroAutorizacaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/erros-autorizacao-admin";

/** Contrato serializável; erros de banco nunca expõem SQL ou dados ao navegador. */
export async function responderOperacaoProduto<T>(operacao: () => Promise<T>) {
  try {
    const dados = await operacao();
    // A escrita já foi confirmada. Falha de cache não deve informar rollback inexistente.
    try {
      revalidatePath("/");
      revalidatePath("/admin/products");
      revalidatePath("/product/[slug]", "page");
      revalidatePath("/category/[slug]", "page");
    } catch {
      /* Contextos de teste sem cache não mudam o resultado transacional. */
    }
    return { sucesso: true as const, dados };
  } catch (erro) {
    const codigo = (erro as { code?: string })?.code;
    const mensagem =
      erro instanceof ErroAutorizacaoAdmin
        ? "Acesso não autorizado. Atualize sua sessão."
        : erro instanceof ZodError
          ? "Dados inválidos ou campos não permitidos."
          : codigo
            ? "Não foi possível salvar. Verifique os dados e atualize o produto."
            : erro instanceof Error
              ? erro.message
              : "Não foi possível concluir a operação.";
    return { sucesso: false as const, mensagem };
  }
}
