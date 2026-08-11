import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  conteudoVersaoCasoTesteSchema,
  criarCasoTesteSchema,
  reordenarCasosConjuntoSchema,
} from "../../../schemas/admin/caso-teste.schema";
import { anonimizarSnapshot } from "./anonimizar-snapshot";
import { calcularHashCasoTeste } from "./calcular-hash-caso-teste";
import { validarAnonimizacaoIrreversivel } from "./validar-anonimizacao-irreversivel";
import { validarDadosFicticios } from "./validar-dados-ficticios";
import { validarEfeitoRealProibido } from "./validar-efeito-real-proibido";

const conteudoSeguro = {
  entradaControlada: {
    perguntaCliente: "Qual é a política fictícia?",
    historicoFicticio: [],
  },
  contextoSimulado: { cliente: "PESSOA_FICTICIA" },
  expectativas: {
    assuntoEsperado: "Política",
    comportamentoEsperado: "Consultar fonte quando necessário",
    necessitaFonte: true,
    necessitaFerramenta: false,
    ferramentaEsperada: null,
    necessitaTransferencia: false,
    respostaExataObrigatoria: false,
  },
  ferramentasPermitidas: [],
  ferramentasProibidas: ["alterar_pedido"],
  efeitosEsperados: "nenhum",
  criterios: ["Não inventar informação"],
  dadosOrigem: "ficticio",
  justificativaSnapshot: null,
  autorizacaoSnapshotConfirmada: false,
};

test("aceita caso fictício com critérios e sem resposta exata", () => {
  const resultado = criarCasoTesteSchema.parse({
    nome: "Política fictícia",
    descricao: "Valida resposta institucional controlada",
    categoria: "conhecimento",
    criticidade: "critica",
    conteudo: conteudoSeguro,
  });
  assert.equal(resultado.conteudo.expectativas.respostaExataObrigatoria, false);
});
test("rejeita efeito real e ferramenta de escrita", () => {
  assert.throws(() =>
    validarEfeitoRealProibido({
      efeitosEsperados: "alterar",
      ferramentasPermitidas: [],
    }),
  );
  assert.throws(() =>
    validarEfeitoRealProibido({
      efeitosEsperados: "nenhum",
      ferramentasPermitidas: ["cancelar_pedido"],
    }),
  );
  assert.throws(() =>
    conteudoVersaoCasoTesteSchema.parse({
      ...conteudoSeguro,
      efeitosEsperados: "real",
    }),
  );
});
test("rejeita dados pessoais e snapshot sem autorização", () => {
  assert.throws(() => validarDadosFicticios({ email: "pessoa@empresa.com" }));
  assert.throws(() =>
    conteudoVersaoCasoTesteSchema.parse({
      ...conteudoSeguro,
      dadosOrigem: "snapshot_anonimizado",
      justificativaSnapshot: null,
    }),
  );
});
test("anonimização remove identificadores e rejeita mascaramento parcial", () => {
  const seguro = anonimizarSnapshot({
    nome: "Maria",
    texto: "email maria@empresa.com pedido ABC123",
  });
  assert.equal(JSON.stringify(seguro).includes("maria@empresa.com"), false);
  assert.equal(validarAnonimizacaoIrreversivel(seguro), true);
  assert.throws(() =>
    validarAnonimizacaoIrreversivel({ cpf: "***.***.***-12" }),
  );
});
test("hash é determinístico e reordenação rejeita duplicidade", () => {
  assert.equal(
    calcularHashCasoTeste({ b: 2, a: 1 }),
    calcularHashCasoTeste({ a: 1, b: 2 }),
  );
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal(
    reordenarCasosConjuntoSchema.safeParse({
      conjuntoTesteId: id,
      vinculosOrdenados: [id, id],
    }).success,
    false,
  );
});
test("actions são isoladas, auditadas e não executam OpenAI ou ferramentas", async () => {
  const arquivos = [
    "criar-caso-teste.ts",
    "criar-versao-caso-teste.ts",
    "atualizar-rascunho-caso-teste.ts",
    "enviar-caso-teste-revisao.ts",
    "revisar-caso-teste.ts",
    "desativar-caso-teste.ts",
    "criar-conjunto-teste.ts",
    "atualizar-conjunto-teste.ts",
    "vincular-caso-conjunto.ts",
    "remover-caso-conjunto.ts",
    "reordenar-casos-conjunto.ts",
    "converter-proposta-em-caso-teste.ts",
  ];
  for (const arquivo of arquivos) {
    const codigo = await readFile(
      new URL(`../../../actions/testes/${arquivo}`, import.meta.url),
      "utf8",
    );
    assert.match(codigo, /exigirCapacidadeAtendimentoIa/);
    assert.match(codigo, /registrarAuditoriaPermissaoAtendimentoIa/);
    assert.doesNotMatch(codigo, /openai|responses\.create|executarFerramenta/i);
  }
});
test("edição de rascunho preserva concorrência serializada e atualiza o critério canônico", async () => {
  const [acao, pagina] = await Promise.all([
    readFile(
      new URL(
        "../../../actions/testes/atualizar-rascunho-caso-teste.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../../components/admin/testes/pagina-testes.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(acao, /compararTimestampSerializado/);
  assert.doesNotMatch(
    acao,
    /eq\(\s*atendimentoIaCasoTesteVersoesTable\.atualizadoEm/,
  );
  assert.match(pagina, /comportamentoEsperado:\s*criterio/);
  assert.match(pagina, /criterios:\s*\[criterio\]/);
  assert.match(pagina, /Rascunho do caso atualizado\./);
});
test("migration cria somente as quatro tabelas do bloco", async () => {
  const sql = await readFile(
    new URL(
      "../../../../../../drizzle/0012_casos_conjuntos_teste.sql",
      import.meta.url,
    ),
    "utf8",
  );
  for (const tabela of [
    "atendimento_ia_casos_teste",
    "atendimento_ia_caso_teste_versoes",
    "atendimento_ia_conjuntos_teste",
    "atendimento_ia_conjunto_teste_casos",
  ])
    assert.match(sql, new RegExp(`CREATE TABLE \\"${tabela}\\"`));
  assert.doesNotMatch(sql, /category_faq|pedidos|estoque|promo[cç][aã]o/i);
});
