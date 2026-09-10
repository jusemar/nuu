import { z } from "zod";

export const solicitarOtpConviteAdminSchema = z.object({
  token: z.string().min(32).max(256),
});

export const confirmarOtpConviteAdminSchema = solicitarOtpConviteAdminSchema.extend({
  code: z.string().regex(/^[0-9]{6}$/),
});

export const identificarUsuarioConviteAdminSchema = solicitarOtpConviteAdminSchema;

/** O aceite deriva toda identidade e autorização da prova já confirmada. */
export const aceitarConviteAdminSchema = z.object({
  token: z.string().min(32).max(256),
}).strict();

export const cadastrarUsuarioConviteAdminSchema = solicitarOtpConviteAdminSchema.extend({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((valor) => valor.toLowerCase()),
  password: z.string().min(8).max(128),
  passwordConfirmation: z.string().min(8).max(128),
}).refine((dados) => dados.password === dados.passwordConfirmation, {
  message: "Senhas não coincidem.", path: ["passwordConfirmation"],
});
