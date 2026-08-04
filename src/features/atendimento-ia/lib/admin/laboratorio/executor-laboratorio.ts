import { createHash } from "node:crypto";

import { LIMITES_LABORATORIO } from "../../../constants/admin/limites-laboratorio";
import { MODELO_PRINCIPAL_ATENDENTE_IA } from "../../../constants/configuracao-atendente";
import {
  respostaEstruturadaOpenAiSchema,
  schemaJsonRespostaOpenAi,
} from "../../../schemas/resposta-openai.schema";
import type { ClienteResponsesOpenAi } from "../../../types/integracao-openai";
import { compararResultados } from "./comparar-resultados";
import { estimarCustoLaboratorio } from "./politica-custo-laboratorio";
import { simularFerramenta } from "./simulador-ferramentas";
import { validarIsolamentoLaboratorio } from "./validar-isolamento-laboratorio";

export type EntradaExecutorLaboratorio = {
  pergunta: string;
  criterios: string[];
  contextoSimulado: Record<string, unknown>;
  snapshotPublicado: {
    conhecimento: { id: string; hash: string; conteudo: string } | null;
    comportamento: { id: string; hash: string; instrucoes: string } | null;
  };
  snapshotCandidato: {
    conhecimento: { id: string; hash: string; conteudo: string } | null;
    comportamento: { id: string; hash: string; instrucoes: string } | null;
  };
};
function extrairResposta(texto: string) {
  const valor = respostaEstruturadaOpenAiSchema.parse(JSON.parse(texto));
  return valor.decisao.resposta ?? valor.decisao.transferencia.explicacao;
}
function instrucoes(
  snapshot: EntradaExecutorLaboratorio["snapshotPublicado"],
  contexto: Record<string, unknown>,
) {
  return `Você está em um laboratório administrativo isolado. Nunca execute ações. Responda apenas com o conhecimento e comportamento fornecidos. Se dados reais forem necessários, informe a limitação.\nCONHECIMENTO:\n${snapshot.conhecimento?.conteudo ?? "Nenhum conhecimento específico."}\nCOMPORTAMENTO:\n${snapshot.comportamento?.instrucoes ?? "Seja claro, seguro e objetivo."}\nCONTEXTO FICTÍCIO OU ANONIMIZADO:\n${JSON.stringify(contexto)}`;
}
export async function executarComparacaoLaboratorio(
  cliente: ClienteResponsesOpenAi,
  entrada: EntradaExecutorLaboratorio,
) {
  validarIsolamentoLaboratorio(entrada);
  const inicio = Date.now();
  const mapaSimulacoes = [
    [/pre[cç]o/i, "consultar_preco_ficticio"],
    [/estoque|dispon[ií]vel/i, "consultar_estoque_ficticio"],
    [/promo[cç][aã]o/i, "consultar_promocao_ficticia"],
    [/frete|entrega|prazo/i, "consultar_logistica_ficticia"],
    [/pedido/i, "consultar_pedido_anonimizado"],
    [/atendente|humano|transfer/i, "simular_transferencia"],
  ] as const;
  const ferramentasSimuladas = mapaSimulacoes
    .filter(([padrao]) => padrao.test(entrada.pergunta))
    .map(([, nome]) => nome);
  const contextoComSimulacoes = {
    ...entrada.contextoSimulado,
    simulacoesDeterministicas: Object.fromEntries(
      ferramentasSimuladas.map((nome) => [
        nome,
        simularFerramenta(nome, { pergunta: entrada.pergunta }),
      ]),
    ),
  };
  const gerar = (snapshot: EntradaExecutorLaboratorio["snapshotPublicado"]) =>
    cliente.criar(
      {
        model: MODELO_PRINCIPAL_ATENDENTE_IA,
        instructions: instrucoes(snapshot, contextoComSimulacoes),
        input: entrada.pergunta,
        max_output_tokens: LIMITES_LABORATORIO.maximoTokensPorResposta,
        safety_identifier: createHash("sha256")
          .update(entrada.pergunta)
          .digest("hex"),
        store: false,
        stream: false,
        text: {
          format: {
            name: "decisao_laboratorio_atendente_ia",
            schema: schemaJsonRespostaOpenAi as unknown as Record<
              string,
              unknown
            >,
            strict: true,
            type: "json_schema",
          },
        },
        tool_choice: "auto",
        tools: [],
        truncation: "disabled",
      },
      { maxRetries: 0, timeout: LIMITES_LABORATORIO.timeoutMs },
    );
  const [publicada, candidata] = await Promise.all([
    gerar(entrada.snapshotPublicado),
    gerar(entrada.snapshotCandidato),
  ]);
  const tokensEntrada =
    (publicada.usage?.input_tokens ?? 0) + (candidata.usage?.input_tokens ?? 0);
  const tokensSaida =
    (publicada.usage?.output_tokens ?? 0) +
    (candidata.usage?.output_tokens ?? 0);
  return {
    ...compararResultados({
      respostaPublicada: extrairResposta(publicada.output_text),
      respostaCandidata: extrairResposta(candidata.output_text),
      criterios: entrada.criterios,
      conflitos: [],
      fontesAusentes: [],
      violacoes: [],
    }),
    modelo: candidata.model,
    tokensEntrada,
    tokensSaida,
    custoEstimado: estimarCustoLaboratorio(tokensEntrada, tokensSaida),
    duracao: Date.now() - inicio,
    conhecimentosUsadosPublicada: entrada.snapshotPublicado.conhecimento
      ? [entrada.snapshotPublicado.conhecimento.id]
      : [],
    conhecimentosUsadosCandidata: entrada.snapshotCandidato.conhecimento
      ? [entrada.snapshotCandidato.conhecimento.id]
      : [],
    ferramentasSolicitadas: ferramentasSimuladas,
    ferramentasSimuladas,
    necessidadeConsultaReal: ferramentasSimuladas.length > 0,
  };
}
