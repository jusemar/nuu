import { z } from "zod";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

const chaves = CATALOGO_PERMISSOES_ADMIN.map(({ chave }) => chave) as [
  (typeof CATALOGO_PERMISSOES_ADMIN)[number]["chave"],
  ...(typeof CATALOGO_PERMISSOES_ADMIN)[number]["chave"][],
];

export const salvarAcessoAdministradorSchema = z.object({
  administradorId: z.string().uuid(),
  funcaoId: z.string().uuid().nullable(),
  permissoesEfetivas: z.array(z.enum(chaves)).max(chaves.length),
  status: z.enum(["ativo", "desativado"]),
});

export type SalvarAcessoAdministradorEntrada = z.infer<
  typeof salvarAcessoAdministradorSchema
>;
