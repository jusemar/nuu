import { z } from "zod";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { normalizarTelefoneBrasileiroAmigavel } from "@/features/autenticacao/lib/normalizar-identificador-cliente";
import { normalizarTelefoneAutenticavel } from "@/features/comunicacao/whatsapp/lib/normalizar-telefone-autenticavel";

const chaves = CATALOGO_PERMISSOES_ADMIN.map(({ chave }) => chave) as [
  (typeof CATALOGO_PERMISSOES_ADMIN)[number]["chave"],
  ...(typeof CATALOGO_PERMISSOES_ADMIN)[number]["chave"][],
];

function normalizarTelefoneConvite(valor: string) {
  const telefoneBrasileiro = normalizarTelefoneBrasileiroAmigavel(valor);
  if (!telefoneBrasileiro) throw new Error("TELEFONE_INVALIDO");
  return normalizarTelefoneAutenticavel(telefoneBrasileiro);
}

export const criarConviteAdministradorSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .transform((valor) => valor.toLowerCase())
      .optional(),
    funcaoId: z.string().uuid().nullable(),
    nome: z.string().trim().min(2).max(120),
    permissoesEfetivas: z.array(z.enum(chaves)).max(chaves.length),
    telefone: z.string().trim().min(1).max(32).optional(),
    // A omissão preserva as chamadas legadas, que sempre criaram convite por e-mail.
    tipoIdentificador: z.enum(["email", "whatsapp"]).default("email"),
  })
  .superRefine((dados, contexto) => {
    if (dados.tipoIdentificador === "email") {
      if (!dados.email) {
        contexto.addIssue({
          code: "custom",
          message: "E-mail é obrigatório para este convite.",
          path: ["email"],
        });
      }
      if (dados.telefone) {
        contexto.addIssue({
          code: "custom",
          message: "Telefone não é permitido em convite por e-mail.",
          path: ["telefone"],
        });
      }
      return;
    }

    if (!dados.telefone) {
      contexto.addIssue({
        code: "custom",
        message: "Telefone é obrigatório para este convite.",
        path: ["telefone"],
      });
    } else {
      try {
        normalizarTelefoneConvite(dados.telefone);
      } catch {
        contexto.addIssue({
          code: "custom",
          message: "Telefone inválido.",
          path: ["telefone"],
        });
      }
    }
    if (dados.email) {
      contexto.addIssue({
        code: "custom",
        message: "E-mail não é permitido em convite por WhatsApp.",
        path: ["email"],
      });
    }
  })
  .transform((dados) => ({
    ...dados,
    email: dados.tipoIdentificador === "email" ? dados.email! : null,
    identificadorNormalizado:
      dados.tipoIdentificador === "email"
        ? dados.email!
        : normalizarTelefoneConvite(dados.telefone!),
  }));

export const conviteIdSchema = z.string().uuid();
export const tokenConviteSchema = z.string().min(32).max(256);
