import type { z } from "zod";

import type { criarVersaoConhecimentoSchema } from "../../../schemas/admin/editor-conhecimento.schema";
import { montarConteudoCanonicoConhecimento } from "./montar-conteudo-canonico-conhecimento";

export function prepararVersaoConhecimento(
  tipoConhecimento: "institucional" | "pergunta_resposta",
  dados: z.infer<typeof criarVersaoConhecimentoSchema>,
  metadados: {
    categoria: string;
    origem: string;
    tituloAdministrativo: string;
  },
) {
  return montarConteudoCanonicoConhecimento({
    ...metadados,
    conteudo: dados.conteudo,
    motivoAlteracao: dados.motivoAlteracao,
    tipoConhecimento,
  } as Parameters<typeof montarConteudoCanonicoConhecimento>[0]);
}
