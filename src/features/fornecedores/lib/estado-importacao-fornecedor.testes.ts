import assert from "node:assert/strict";
import test from "node:test";

import { derivarEstadoImportacaoFornecedor } from "./estado-importacao-fornecedor";

const zerados = {
  total: 0,
  publicados: 0,
  pendentes: 0,
  ignorados: 0,
  erros: 0,
};

test("importação recém-criada, ainda sem linhas, está em andamento", () => {
  assert.equal(
    derivarEstadoImportacaoFornecedor({
      contadores: zerados,
      statusImportacao: "em_staging",
    }),
    "em_andamento",
  );
});

test("tudo pendente e nada decidido continua em andamento", () => {
  assert.equal(
    derivarEstadoImportacaoFornecedor({
      contadores: { ...zerados, total: 10, pendentes: 10 },
      statusImportacao: "em_staging",
    }),
    "em_andamento",
  );
});

test("parte publicada e parte pendente é parcialmente processada", () => {
  assert.equal(
    derivarEstadoImportacaoFornecedor({
      contadores: { ...zerados, total: 10, publicados: 4, pendentes: 6 },
      statusImportacao: "em_staging",
    }),
    "parcialmente_processada",
  );
});

test("sem pendências a importação está concluída", () => {
  assert.equal(
    derivarEstadoImportacaoFornecedor({
      contadores: { ...zerados, total: 10, publicados: 7, ignorados: 3 },
      statusImportacao: "em_staging",
    }),
    "concluida",
  );
});

test("erro na aquisição prevalece sobre o andamento", () => {
  assert.equal(
    derivarEstadoImportacaoFornecedor({
      contadores: { ...zerados, total: 10, publicados: 10 },
      statusImportacao: "erro",
    }),
    "com_erros",
  );
});

test("linha com erro no staging também marca a importação", () => {
  assert.equal(
    derivarEstadoImportacaoFornecedor({
      contadores: { ...zerados, total: 10, publicados: 9, erros: 1 },
      statusImportacao: "em_staging",
    }),
    "com_erros",
  );
});

import { agregarContadoresImportacoesFornecedor } from "./estado-importacao-fornecedor";

const ARQUIVO = "cccccccc-0000-0000-0000-000000000001";
const API_A = "dddddddd-0000-0000-0000-00000000000a";
const API_B = "dddddddd-0000-0000-0000-00000000000b";

test("CENÁRIO 1: nenhuma importação devolve mapa vazio", () => {
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [],
    linhasStaging: [{ importacaoId: ARQUIVO, status: "ignorado", total: 9 }],
    linhasRascunho: [],
  });

  assert.equal(contadores.size, 0);
});

test("CENÁRIO 2: uma importação de arquivo soma os próprios estados", () => {
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [ARQUIVO],
    linhasStaging: [
      { importacaoId: ARQUIVO, status: "aguardando_analise", total: 7 },
      { importacaoId: ARQUIVO, status: "ignorado", total: 2 },
      { importacaoId: ARQUIVO, status: "erro", total: 1 },
    ],
    linhasRascunho: [
      { importacaoId: ARQUIVO, status: "publicado", total: 1 },
      { importacaoId: ARQUIVO, status: "pendente_conciliacao", total: 3 },
    ],
  });

  assert.deepEqual(contadores.get(ARQUIVO), {
    total: 10,
    publicados: 1,
    pendentes: 6,
    ignorados: 2,
    erros: 1,
  });
});

test("CENÁRIO 3 e 6: várias importações não misturam contadores", () => {
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [ARQUIVO, API_A, API_B],
    linhasStaging: [
      { importacaoId: ARQUIVO, status: "aguardando_analise", total: 10 },
      { importacaoId: API_A, status: "novo", total: 5 },
      { importacaoId: API_A, status: "ignorado", total: 1 },
      { importacaoId: API_B, status: "novo", total: 4 },
    ],
    linhasRascunho: [{ importacaoId: API_A, status: "publicado", total: 2 }],
  });

  assert.equal(contadores.size, 3);
  assert.deepEqual(contadores.get(ARQUIVO), {
    total: 10,
    publicados: 0,
    pendentes: 10,
    ignorados: 0,
    erros: 0,
  });
  assert.deepEqual(contadores.get(API_A), {
    total: 6,
    publicados: 2,
    pendentes: 3,
    ignorados: 1,
    erros: 0,
  });
  assert.deepEqual(contadores.get(API_B), {
    total: 4,
    publicados: 0,
    pendentes: 4,
    ignorados: 0,
    erros: 0,
  });
});

test("CENÁRIO 8: o mesmo código em duas execuções conta uma vez em cada", () => {
  // #A e #B trouxeram o MESMO produto. Publicar na #A não pode mexer na #B.
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [API_A, API_B],
    linhasStaging: [
      { importacaoId: API_A, status: "novo", total: 1 },
      { importacaoId: API_B, status: "novo", total: 1 },
    ],
    linhasRascunho: [{ importacaoId: API_A, status: "publicado", total: 1 }],
  });

  assert.equal(contadores.get(API_A)?.publicados, 1);
  assert.equal(contadores.get(API_A)?.pendentes, 0);
  assert.equal(contadores.get(API_B)?.publicados, 0);
  assert.equal(contadores.get(API_B)?.pendentes, 1);
});

test("CENÁRIO 7: importação antiga sem itens vem zerada, não ausente", () => {
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [ARQUIVO],
    linhasStaging: [],
    linhasRascunho: [],
  });

  assert.deepEqual(contadores.get(ARQUIVO), {
    total: 0,
    publicados: 0,
    pendentes: 0,
    ignorados: 0,
    erros: 0,
  });
});

test("linha legada, sem execução, não entra em contador nenhum", () => {
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [API_A],
    linhasStaging: [
      { importacaoId: API_A, status: "novo", total: 2 },
      // Staging antigo da API: existe no banco, mas não pertence a ciclo algum.
      { importacaoId: null, status: "novo", total: 100 },
    ],
    linhasRascunho: [],
  });

  assert.equal(contadores.get(API_A)?.total, 2);
  assert.equal(contadores.size, 1);
});

test("execução fora do pedido não vaza para o resultado", () => {
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [API_A],
    linhasStaging: [
      { importacaoId: API_A, status: "novo", total: 2 },
      { importacaoId: API_B, status: "novo", total: 50 },
    ],
    linhasRascunho: [{ importacaoId: API_B, status: "publicado", total: 50 }],
  });

  assert.equal(contadores.size, 1);
  assert.equal(contadores.get(API_A)?.total, 2);
  assert.equal(contadores.get(API_B), undefined);
});

test("count vindo do driver como texto continua somando como número", () => {
  // `count(*)` chega como string em alguns drivers; somar texto daria "00".
  const contadores = agregarContadoresImportacoesFornecedor({
    importacaoIds: [ARQUIVO],
    linhasStaging: [
      { importacaoId: ARQUIVO, status: "novo", total: "7" },
      { importacaoId: ARQUIVO, status: "ignorado", total: "3" },
    ],
    linhasRascunho: [],
  });

  assert.deepEqual(contadores.get(ARQUIVO), {
    total: 10,
    publicados: 0,
    pendentes: 7,
    ignorados: 3,
    erros: 0,
  });
});
