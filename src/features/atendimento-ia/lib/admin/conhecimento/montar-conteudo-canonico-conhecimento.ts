import { createHash } from "node:crypto";

import type { z } from "zod";

import { criarConhecimentoEditorSchema } from "../../../schemas/admin/editor-conhecimento.schema";
import { gerarConteudoCanonicoFaq } from "./gerar-conteudo-canonico-faq";
import { validarConhecimentoEstatico } from "./validar-conhecimento-estatico";

type Entrada = z.infer<typeof criarConhecimentoEditorSchema>;
export function montarConteudoCanonicoConhecimento(entrada: Entrada) {
  const conteudo =
    entrada.tipoConhecimento === "pergunta_resposta"
      ? gerarConteudoCanonicoFaq(entrada.conteudo)
      : JSON.stringify({
          conteudoOficial: entrada.conteudo.conteudoOficial,
          palavrasChave: entrada.conteudo.palavrasChave,
          prioridade: entrada.conteudo.prioridade,
          quandoNaoUtilizar: entrada.conteudo.quandoNaoUtilizar,
          quandoUtilizar: entrada.conteudo.quandoUtilizar,
          termosRelacionados: entrada.conteudo.termosRelacionados,
        });
  const validacao = validarConhecimentoEstatico([conteudo]);
  if (!validacao.valido)
    throw new Error(
      `CONHECIMENTO_ESTATICO_INVALIDO:${validacao.violacoes.join(",")}`,
    );
  return {
    conteudo,
    hash: createHash("sha256").update(conteudo).digest("hex"),
  };
}
