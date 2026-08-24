import { z } from "zod";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

const chaves = CATALOGO_PERMISSOES_ADMIN.map(({ chave }) => chave) as [
  (typeof CATALOGO_PERMISSOES_ADMIN)[number]["chave"],
  ...(typeof CATALOGO_PERMISSOES_ADMIN)[number]["chave"][],
];

export const criarConviteAdministradorSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((valor) => valor.toLowerCase()),
  funcaoId: z.string().uuid().nullable(),
  nome: z.string().trim().min(2).max(120),
  permissoesEfetivas: z.array(z.enum(chaves)).max(chaves.length),
});

export const conviteIdSchema = z.string().uuid();
export const tokenConviteSchema = z.string().min(32).max(256);
