import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import type { ClienteResponsesOpenAi } from "../../../types/integracao-openai";
import { executarComparacaoLaboratorio } from "./executor-laboratorio";
import { montarSnapshotCandidato } from "./montar-snapshot-candidato";
import { montarSnapshotPublicado } from "./montar-snapshot-publicado";
import { estimarCustoLaboratorio } from "./politica-custo-laboratorio";
import { decidirModoExecucao } from "./politica-modo-execucao";
import { sanitizarResultadoLaboratorio } from "./sanitizar-resultado-laboratorio";
import { simularFerramenta } from "./simulador-ferramentas";
const resposta = (texto: string) =>
  JSON.stringify({
    criterio_escalonamento: null,
    decisao: {
      encaminhamento: "gerar_resposta",
      resposta: texto,
      transferencia: null,
    },
  });
test("executa comparação isolada e estruturada com cliente injetado", async () => {
  let chamadas = 0;
  const cliente: ClienteResponsesOpenAi = {
    async criar(req) {
      chamadas++;
      assert.deepEqual(req.tools, []);
      assert.equal(req.store, false);
      return {
        id: `r${chamadas}`,
        model: "gpt-5.6-terra",
        output: [],
        output_text: resposta(chamadas === 1 ? "publicada" : "candidata"),
        error: null,
        incomplete_details: null,
        status: "completed",
        usage: { input_tokens: 10, output_tokens: 5 },
      };
    },
  };
  const resultado = await executarComparacaoLaboratorio(cliente, {
    pergunta: "Pergunta fictícia",
    criterios: ["candidata"],
    contextoSimulado: {},
    snapshotPublicado: montarSnapshotPublicado(
      { id: "p", estado: "publicado", hash: "hp", conteudo: "publicado" },
      null,
    ),
    snapshotCandidato: montarSnapshotCandidato(
      { id: "c", hash: "hc", conteudo: "candidato" },
      null,
    ),
  });
  assert.equal(chamadas, 2);
  assert.equal(resultado.respostaPublicada, "publicada");
  assert.equal(resultado.respostaCandidata, "candidata");
});
test("modo síncrono e assíncrono respeitam limites", () => {
  assert.equal(
    decidirModoExecucao({ quantidadeCasos: 1, tipoComparacao: "conhecimento" }),
    "sincrono",
  );
  assert.equal(
    decidirModoExecucao({ quantidadeCasos: 3, tipoComparacao: "conhecimento" }),
    "sincrono",
  );
  assert.equal(
    decidirModoExecucao({ quantidadeCasos: 4, tipoComparacao: "conhecimento" }),
    "assincrono",
  );
  assert.equal(
    decidirModoExecucao({ quantidadeCasos: 1, tipoComparacao: "combinado" }),
    "assincrono",
  );
  assert.throws(() =>
    decidirModoExecucao({ quantidadeCasos: 101, tipoComparacao: "lote" }),
  );
});
test("snapshot publicado rejeita rascunho e candidato fica isolado", () => {
  assert.throws(() =>
    montarSnapshotPublicado(
      { id: "x", estado: "rascunho", hash: "h", conteudo: "x" },
      null,
    ),
  );
  assert.equal(
    montarSnapshotCandidato({ id: "x", hash: "h", conteudo: "x" }, null)
      .isoladoDoChatPublico,
    true,
  );
});
test("simuladores são determinísticos e ferramentas de escrita inexistem", () => {
  assert.deepEqual(
    simularFerramenta("consultar_preco_ficticio", { sku: "FICTICIO" }),
    simularFerramenta("consultar_preco_ficticio", { sku: "FICTICIO" }),
  );
  assert.throws(() => simularFerramenta("alterar_estoque", {}));
  assert.throws(() => simularFerramenta("enviar_whatsapp", {}));
});
test("limites de custo, tokens e sanitização", () => {
  assert.equal(estimarCustoLaboratorio(100, 100) > 0, true);
  assert.throws(() => estimarCustoLaboratorio(60_001, 0));
  assert.doesNotMatch(
    sanitizarResultadoLaboratorio(new Error("sk-segredo pessoa@loja.com")),
    /segredo|pessoa@/,
  );
});
test("ações e executor não importam orquestrador nem ferramentas reais", async () => {
  const caminhos = [
    new URL("./executor-laboratorio.ts", import.meta.url),
    new URL(
      "../../../actions/testes/executor-laboratorio-interno.ts",
      import.meta.url,
    ),
    new URL(
      "../../../actions/testes/executar-teste-individual.ts",
      import.meta.url,
    ),
    new URL("../../../actions/testes/iniciar-regressao.ts", import.meta.url),
  ];
  for (const caminho of caminhos) {
    const codigo = await readFile(caminho, "utf8");
    assert.doesNotMatch(
      codigo,
      /executar-orquestrador|repositorio-orquestrador|ferramentas-protegidas|ferramentas-publicas/,
    );
  }
});
test("chat público não referencia laboratório ou candidato", async () => {
  const arquivos = [
    new URL(
      "../../../actions/executar-orquestrador-mensagem.ts",
      import.meta.url,
    ),
    new URL("../../../lib/componente-processamento-openai.ts", import.meta.url),
  ];
  for (const arquivo of arquivos)
    assert.doesNotMatch(
      await readFile(arquivo, "utf8"),
      /execucoesLaboratorio|snapshotCandidato|versaoCandidata/,
    );
});

test("persistência cobre idempotência, cancelamento, retomada e retenção", async () => {
  const sql = await readFile(
    new URL(
      "../../../../../../drizzle/0013_laboratorio_isolado.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /chave_idempotencia/);
  assert.match(sql, /execucoes_lab_idempotencia_unique/);
  assert.match(sql, /expira_em/);
  assert.doesNotMatch(sql, /category_faq|checkout_pedidos|product_pricing/);
  for (const nome of [
    "cancelar-regressao.ts",
    "retomar-regressao.ts",
    "avaliar-resultado-laboratorio.ts",
  ]) {
    const codigo = await readFile(
      new URL(`../../../actions/testes/${nome}`, import.meta.url),
      "utf8",
    );
    assert.match(codigo, /exigirCapacidadeAtendimentoIa/);
    assert.match(codigo, /registrarAuditoriaPermissaoAtendimentoIa/);
  }
});
