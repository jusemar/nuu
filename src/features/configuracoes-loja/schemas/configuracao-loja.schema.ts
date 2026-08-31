import { z } from "zod";

export const configuracaoLojaSchema = z.object({
  nomeComercial: z
    .string()
    .max(120, "O nome comercial deve ter no máximo 120 caracteres."),
  logoCabecalhoUrl: z
    .string()
    .trim()
    .max(2_048, "A URL da logo do cabeçalho é muito longa.")
    .refine(validarUrlImagem, "A URL da logo do cabeçalho é inválida."),
  logoRodapeUrl: z
    .string()
    .trim()
    .max(2_048, "A URL da logo do rodapé é muito longa.")
    .refine(validarUrlImagem, "A URL da logo do rodapé é inválida."),
});

/** Aceita arquivos públicos locais e URLs HTTPS geradas pelo armazenamento. */
function validarUrlImagem(valor: string) {
  if (!valor) return true;
  if (valor.startsWith("/") && !valor.startsWith("//")) return true;
  try {
    return new URL(valor).protocol === "https:";
  } catch {
    return false;
  }
}
