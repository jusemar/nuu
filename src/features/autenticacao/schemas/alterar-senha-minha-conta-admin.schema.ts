import { z } from "zod";

export const alterarSenhaMinhaContaAdminSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmacaoNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmacaoNovaSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmacaoNovaSenha"],
  });

export type AlterarSenhaMinhaContaAdminSchema = z.infer<
  typeof alterarSenhaMinhaContaAdminSchema
>;
