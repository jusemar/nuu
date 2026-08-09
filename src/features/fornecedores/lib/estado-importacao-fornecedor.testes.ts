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
