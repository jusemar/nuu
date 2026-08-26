import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ResultadoChamadaLaquila } from "./cliente-laquila";
import {
  type GrupoPedidoLaquilaPreparado,
  processarGruposPedidoLaquila,
  type RegistroPedidoLaquila,
  type RepositorioPedidoLaquila,
} from "./processar-grupos-pedido-laquila";
import type { ResultadoRevalidacaoEstoqueLaquila } from "./revalidar-estoque-pedido-laquila";

const grupo: GrupoPedidoLaquilaPreparado = {
  ambiente: "homologacao",
  pedidoId: "11111111-1111-4111-8111-111111111111",
  fornecedorId: "22222222-2222-4222-8222-222222222222",
  chaveGrupo: "expedicao:fornecedor:laquila",
  chaveIdempotencia: "pedido:teste:provedor:laquila:grupo:teste",
  hashPayload: "hash-teste",
  payloadSanitizado: {
    cd_transportador: "63993",
    itens: [{ cd_item: "1104095", qt_pedida: 1, vl_unitario: 23.69 }],
  },
  pedidoSemCredenciais: {
    cpf_cnpj: "12345678901",
    cpf_cnpj_consulta: "12345678901",
    nm_cliente: "Cliente Teste",
    email: "teste@example.com",
    nr_celular: "41999999999",
    cd_transportador: "63993",
    itens: [{ cd_item: "1104095", qt_pedida: 1, vl_unitario: 23.69 }],
  },
  credenciais: {
    cnpjEmpresa: "00000000000000",
    tokenCliente: "token-teste",
    configuracao: {
      id: "integracao-teste",
      ambiente: "homologacao",
      urlBase: "https://example.test",
      cnpjEmpresa: "00000000000000",
    },
  },
};

function criarRepositorioFake() {
  let registro: RegistroPedidoLaquila | null = null;
  const repositorio: RepositorioPedidoLaquila = {
    async persistirPendente(item) {
      registro ??= {
        id: "registro-teste",
        status: "pendente",
        hashPayload: item.hashPayload,
        tentativas: 0,
        idPedidoExterno: null,
        erroSanitizado: null,
      };
    },
    async buscar() {
      if (!registro) throw new Error("Registro fake ausente.");
      return { ...registro };
    },
    async adquirir(atual, hashAtual) {
      if (
        !registro ||
        registro.id !== atual.id ||
        registro.hashPayload !== hashAtual ||
        !["pendente", "falha"].includes(registro.status)
      ) {
        return null;
      }
      registro = { ...registro, status: "processando", erroSanitizado: null };
      return { ...registro };
    },
    async registrarTentativa() {
      if (!registro || registro.status !== "processando") {
        throw new Error("Registro fake não adquirido.");
      }
      registro = { ...registro, tentativas: registro.tentativas + 1 };
      return { ...registro };
    },
    async finalizar(_id, atualizacao) {
      if (!registro) throw new Error("Registro fake ausente.");
      registro = { ...registro, ...atualizacao };
      return { ...registro };
    },
  };

  return { repositorio, ler: () => registro };
}

function criarCenario(resposta: ResultadoChamadaLaquila, estoqueValido = true) {
  const fake = criarRepositorioFake();
  let chamadas = 0;
  return {
    ...fake,
    chamadas: () => chamadas,
    dependencias: {
      repositorio: fake.repositorio,
      async revalidarEstoque(): Promise<ResultadoRevalidacaoEstoqueLaquila> {
        return estoqueValido
          ? { sucesso: true, itens: [] }
          : { sucesso: false, erro: "Estoque indisponível." };
      },
      async enviarPedido() {
        chamadas += 1;
        await Promise.resolve();
        return resposta;
      },
    },
  };
}

describe("processamento injetável do pedido Laquila", () => {
  it("processa sucesso, reconhece id externo e não repete após criado", async () => {
    const cenario = criarCenario({
      sucesso: true,
      codigoHttp: 200,
      dados: { resultado: { id_pedido: "TESTE-00002-123" } },
    });

    await processarGruposPedidoLaquila([grupo], cenario.dependencias);
    await processarGruposPedidoLaquila([grupo], cenario.dependencias);

    assert.equal(cenario.chamadas(), 1);
    assert.equal(cenario.ler()?.status, "criado");
    assert.equal(cenario.ler()?.idPedidoExterno, "TESTE-00002-123");
    assert.equal(cenario.ler()?.tentativas, 1);
  });

  it("duas execuções concorrentes entregam uma única vez ao cliente fake", async () => {
    const cenario = criarCenario({
      sucesso: true,
      codigoHttp: 200,
      dados: { resultado: { id_pedido: "TESTE-00002-123" } },
    });

    await Promise.all([
      processarGruposPedidoLaquila([grupo], cenario.dependencias),
      processarGruposPedidoLaquila([grupo], cenario.dependencias),
    ]);

    assert.equal(cenario.chamadas(), 1);
    assert.equal(cenario.ler()?.status, "criado");
  });

  for (const [nome, resposta] of [
    [
      "timeout",
      {
        sucesso: false,
        codigoHttp: null,
        erro: "Timeout.",
        diagnostico: { tipo: "timeout" as const },
      },
    ],
    [
      "HTTP 5xx",
      {
        sucesso: false,
        codigoHttp: 500,
        erro: "HTTP 500.",
        diagnostico: { tipo: "http" as const },
      },
    ],
    [
      "erro de rede",
      {
        sucesso: false,
        codigoHttp: null,
        erro: "Rede.",
        diagnostico: { tipo: "rede" as const },
      },
    ],
    [
      "JSON inválido",
      {
        sucesso: false,
        codigoHttp: null,
        erro: "JSON inválido.",
        diagnostico: { tipo: "json_invalido" as const },
      },
    ],
  ] as const) {
    it(`classifica ${nome} como indeterminado e não repete`, async () => {
      const cenario = criarCenario(resposta);
      await processarGruposPedidoLaquila([grupo], cenario.dependencias);
      await processarGruposPedidoLaquila([grupo], cenario.dependencias);
      assert.equal(cenario.chamadas(), 1);
      assert.equal(cenario.ler()?.status, "resultado_indeterminado");
    });
  }

  it("resposta sem id_pedido é falha, nunca sucesso", async () => {
    const cenario = criarCenario({
      sucesso: true,
      codigoHttp: 200,
      dados: { resultado: {} },
    });
    await processarGruposPedidoLaquila([grupo], cenario.dependencias);
    assert.equal(cenario.ler()?.status, "falha");
    assert.equal(cenario.ler()?.idPedidoExterno, null);
  });

  it("estoque inválido bloqueia POST e não contabiliza tentativa externa", async () => {
    const cenario = criarCenario(
      { sucesso: true, codigoHttp: 200, dados: {} },
      false,
    );
    await processarGruposPedidoLaquila([grupo], cenario.dependencias);
    assert.equal(cenario.chamadas(), 0);
    assert.equal(cenario.ler()?.status, "falha");
    assert.equal(cenario.ler()?.tentativas, 0);
  });
});
