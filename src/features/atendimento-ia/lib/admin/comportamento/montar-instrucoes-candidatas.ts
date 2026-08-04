import { configuracaoComportamentoEditorSchema } from "../../../schemas/admin/comportamento-editor.schema";
import { validarNucleoProtegido } from "./validar-nucleo-protegido";
export function montarInstrucoesCandidatas(entrada: unknown) {
  const configuracao = configuracaoComportamentoEditorSchema.parse(entrada);
  validarNucleoProtegido(configuracao);
  return {
    configuracao,
    blocos: {
      blocosEditaveis: configuracao.blocosEditaveis,
      exemplosEvitar: configuracao.exemplosEvitar,
      exemplosPositivos: configuracao.exemplosPositivos,
    },
    versaoNucleo: "nucleo-protegido-v1",
  };
}
