import assert from "node:assert/strict";
import test from "node:test";

import { avaliarPortaoPublicacaoFornecedor } from "./portao-publicacao-fornecedor";

/**
 * Regressão do bug que fazia o gestor percorrer o fluxo inteiro sem publicar
 * nada: dois itens conciliados, sem pendência, mas nenhum aprovado.
 */
test("item conciliado sem aprovação não pode anunciar 'pronto para publicar'", () => {
  const portao = avaliarPortaoPublicacaoFornecedor([
    {
      id: "a",
      pendenciasObrigatorias: [],
      statusRascunho: "pendente_conciliacao",
    },
    {
      id: "b",
      pendenciasObrigatorias: [],
      statusRascunho: "pendente_conciliacao",
    },
  ]);

  assert.equal(portao.estado, "aguardando_aprovacao");
  assert.equal(portao.totalAprovados, 0);
  assert.deepEqual(portao.idsAguardandoAprovacao, ["a", "b"]);
});

test("aprovado libera a etapa e é o que a Publicação vai listar", () => {
  const portao = avaliarPortaoPublicacaoFornecedor([
    {
      id: "a",
      pendenciasObrigatorias: [],
      statusRascunho: "pronto_para_publicar",
    },
  ]);

  assert.equal(portao.estado, "liberada");
  assert.equal(portao.totalAprovados, 1);
  assert.deepEqual(portao.idsAguardandoAprovacao, []);
});

test("pendência obrigatória bloqueia mesmo com outro item já aprovado", () => {
  const portao = avaliarPortaoPublicacaoFornecedor([
    {
      id: "a",
      pendenciasObrigatorias: ["Preço"],
      statusRascunho: "pendente_conciliacao",
    },
    {
      id: "b",
      pendenciasObrigatorias: [],
      statusRascunho: "pronto_para_publicar",
    },
  ]);

  assert.equal(portao.estado, "bloqueada");
  assert.equal(portao.totalPendencias, 1);
});

test("item com pendência não entra na aprovação em massa", () => {
  const portao = avaliarPortaoPublicacaoFornecedor([
    {
      id: "a",
      pendenciasObrigatorias: ["Preço"],
      statusRascunho: "pendente_conciliacao",
    },
    {
      id: "b",
      pendenciasObrigatorias: [],
      statusRascunho: "pendente_conciliacao",
    },
  ]);

  assert.deepEqual(portao.idsAguardandoAprovacao, ["b"]);
});

test("item ignorado não conta como algo a aprovar", () => {
  const portao = avaliarPortaoPublicacaoFornecedor([
    {
      id: "a",
      pendenciasObrigatorias: [],
      statusRascunho: "pendente_conciliacao",
      ignorado: true,
    },
  ]);

  assert.equal(portao.estado, "vazia");
  assert.deepEqual(portao.idsAguardandoAprovacao, []);
});

test("publicado sai da conta: nada aprovado, nada a aprovar", () => {
  const portao = avaliarPortaoPublicacaoFornecedor([
    { id: "a", pendenciasObrigatorias: [], statusRascunho: "publicado" },
  ]);

  assert.equal(portao.estado, "vazia");
  assert.equal(portao.totalAprovados, 0);
});

test("etapa sem itens não promete publicação", () => {
  const portao = avaliarPortaoPublicacaoFornecedor([]);

  assert.equal(portao.estado, "vazia");
  assert.equal(portao.totalAprovados, 0);
  assert.equal(portao.totalPendencias, 0);
});
