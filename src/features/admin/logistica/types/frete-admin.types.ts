import type { z } from "zod";

import {
  alternarAtivacaoSchema,
  criarProvedorFreteSchema,
  criarServicoFreteSchema,
  criarTransportadoraFreteSchema,
  editarProvedorFreteSchema,
  editarServicoFreteSchema,
  editarTransportadoraFreteSchema,
} from "../schemas/frete-admin.schema";

export type RespostaAcaoAdminFrete<T> =
  | {
      sucesso: true;
      dados: T;
    }
  | {
      sucesso: false;
      erro: string;
    };

export type CriarProvedorFreteEntrada = z.infer<typeof criarProvedorFreteSchema>;
export type EditarProvedorFreteEntrada = z.infer<typeof editarProvedorFreteSchema>;
export type AlternarAtivacaoEntrada = z.infer<typeof alternarAtivacaoSchema>;

export type CriarTransportadoraFreteEntrada = z.infer<
  typeof criarTransportadoraFreteSchema
>;
export type EditarTransportadoraFreteEntrada = z.infer<
  typeof editarTransportadoraFreteSchema
>;

export type CriarServicoFreteEntrada = z.infer<typeof criarServicoFreteSchema>;
export type EditarServicoFreteEntrada = z.infer<typeof editarServicoFreteSchema>;
