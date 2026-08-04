import { createHash } from "node:crypto";

import { INSTRUCOES_SISTEMA_ATENDENTE_IA } from "../../../constants/instrucoes-openai";
import { configuracaoComportamentoEditorSchema } from "../../../schemas/admin/comportamento-editor.schema";
import { validarNucleoProtegido } from "../comportamento/validar-nucleo-protegido";

export const VERSAO_NUCLEO_COMPORTAMENTO = "nucleo-protegido-v1";

/** Acrescenta somente os campos editoriais autorizados depois do núcleo invariável. */
export function montarInstrucoesPublicadas(entrada: unknown) {
  const configuracao = configuracaoComportamentoEditorSchema.parse(entrada);
  validarNucleoProtegido(configuracao);
  const complemento = [
    "\n\n## Comportamento editorial publicado (subordinado às regras acima)",
    `Parâmetros: ${JSON.stringify(configuracao.parametros)}.`,
    `Saudação: ${configuracao.saudacao}`,
    `Estrutura: ${configuracao.estruturaExplicacao}`,
    ...configuracao.blocosEditaveis.map(
      (bloco) => `${bloco.titulo}: ${bloco.conteudo}`,
    ),
  ].join("\n");
  const instrucoes = `${INSTRUCOES_SISTEMA_ATENDENTE_IA.trim()}${complemento}`;
  return {
    instrucoes,
    hashConfiguracao: createHash("sha256").update(instrucoes).digest("hex"),
    versaoNucleo: VERSAO_NUCLEO_COMPORTAMENTO,
  };
}
