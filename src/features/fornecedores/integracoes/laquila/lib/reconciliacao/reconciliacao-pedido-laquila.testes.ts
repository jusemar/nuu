import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ResultadoChamadaLaquila } from "../cliente-laquila";
import { podeCancelarPedidoPorFornecedor } from "./decidir-cancelamento-operacional";
import {
  atualizarSincronizacaoPedidoLaquila,
  interpretarConsultaPedidoLaquila,
  type SincronizacaoPedidoLaquila,
} from "./estado-pedido-laquila";
import {
  type CandidatoReconciliacaoLaquila,
  type DependenciasReconciliacaoLaquila,
  reconciliarPedidosLaquila,
} from "./reconciliar-pedidos-laquila";

const instante = new Date("2026-10-21T01:00:00Z");
const cancelado: ResultadoChamadaLaquila = {
  sucesso: false,
  codigoHttp: 400,
  erro: "O pedido 1133591 está cancelado.",
  dados: { erro: "O pedido 1133591 está cancelado." },
};
const criado: ResultadoChamadaLaquila = {
  sucesso: true,
  codigoHttp: 200,
  dados: {
    resultado: {
      pedidos: [
        {
          pedido: {
            id_pedido: "1133591",
            ds_estagio_venda: "RECUSA TEMPORÁRIA",
            ds_situacao_venda: "Bloqueado",
            dt_pedido: "07/09/2026",
          },
        },
      ],
    },
  },
};
const candidato: CandidatoReconciliacaoLaquila = {
  id: "integracao",
  pedidoId: "pedido",
  idPedidoExterno: "1133591",
  fornecedorId: "fornecedor",
};

function repositorioMemoria() {
  let estado: SincronizacaoPedidoLaquila | null = null;
  let ocupado = false;
  let consultas = 0;
  let persistencias = 0;
  let resposta = criado;
  let agora = instante;
  const dependencias: DependenciasReconciliacaoLaquila = {
    agora: () => agora,
    async listar() {
      return estado?.ultimoEstado?.terminal ||
        (estado?.proximaConsultaEm &&
          estado.proximaConsultaEm > agora.toISOString())
        ? []
        : [candidato];
    },
    async adquirir() {
      if (ocupado) return null;
      ocupado = true;
      return { concessao: "unica", anterior: estado };
    },
    async consultar() {
      consultas += 1;
      return resposta;
    },
    async persistir(_c, lease, sincronizacao) {
      assert.equal(lease, "unica");
      estado = sincronizacao;
      persistencias += 1;
      ocupado = false;
      return true;
    },
  };
  return {
    dependencias,
    ler: () => ({ estado, consultas, persistencias }),
    alterar: (r: ResultadoChamadaLaquila) => {
      resposta = r;
      agora = new Date(agora.getTime() + 3600_001);
    },
  };
}

describe("reconciliação operacional Laquila", () => {
  it("reconhece a resposta REAL HTTP 400 de cancelamento como estado terminal", () => {
    const estado = interpretarConsultaPedidoLaquila(cancelado, "1133591");
    assert.equal(estado.estado, "cancelado");
    assert.equal(estado.terminal, true);
    assert.equal(estado.erro, null);
  });
  it("não cancela por texto negado, outro pedido ou erro 5xx", () => {
    for (const [http, mensagem] of [
      [400, "O pedido 999 está cancelado."],
      [400, "O pedido 1133591 não está cancelado."],
      [500, "O pedido 1133591 está cancelado."],
    ] as const) {
      assert.equal(
        interpretarConsultaPedidoLaquila(
          {
            sucesso: false,
            codigoHttp: http,
            erro: mensagem,
            dados: { erro: mensagem },
          },
          "1133591",
        ).terminal,
        false,
      );
    }
  });
  it("mantém um pedido criado aberto e preserva estágio/situação sem inventar significado", () => {
    const estado = interpretarConsultaPedidoLaquila(criado, "1133591");
    assert.equal(estado.estado, "aberto");
    assert.equal(estado.terminal, false);
    assert.equal(estado.campos.ds_estagio_venda, "RECUSA TEMPORÁRIA");
    assert.equal(estado.campos.ds_situacao_venda, "Bloqueado");
  });
  it("não transforma resposta desconhecida ou ID ausente em status final", () => {
    const estado = interpretarConsultaPedidoLaquila(
      {
        sucesso: true,
        codigoHttp: 200,
        dados: { mensagem: "Processo novo", status: "CANCELADO" },
      },
      "1133591",
    );
    assert.equal(estado.estado, "desconhecido");
    assert.equal(estado.terminal, false);
  });
  it("não persiste token, dados pessoais nem payload bruto", () => {
    const estado = interpretarConsultaPedidoLaquila(
      {
        sucesso: true,
        codigoHttp: 200,
        dados: {
          id_pedido: "1133591",
          token: "segredo",
          nm_cliente: "Pessoa",
          email: "privado@exemplo.com",
          ds_estagio_venda:
            "segredo privado@exemplo.com https://api.exemplo/secret",
        },
      },
      "1133591",
      ["segredo"],
    );
    const serializado = JSON.stringify(estado);
    assert.doesNotMatch(serializado, /segredo|privado@|api\.exemplo|Pessoa/);
    assert.equal(Object.hasOwn(estado.campos, "token"), false);
  });
  it("sincroniza mudança posterior e não volta a consultar terminal", async () => {
    const repo = repositorioMemoria();
    await reconciliarPedidosLaquila(repo.dependencias);
    assert.equal(repo.ler().estado?.ultimoEstado?.estado, "aberto");
    repo.alterar(cancelado);
    await reconciliarPedidosLaquila(repo.dependencias);
    assert.equal(repo.ler().estado?.ultimoEstado?.estado, "cancelado");
    assert.equal(repo.ler().estado?.proximaConsultaEm, null);
    await reconciliarPedidosLaquila(repo.dependencias);
    assert.equal(repo.ler().consultas, 2);
  });
  it("falha temporária preserva o último estado e aplica backoff", () => {
    const anterior = atualizarSincronizacaoPedidoLaquila({
      anterior: null,
      consulta: interpretarConsultaPedidoLaquila(criado, "1133591"),
      agora: instante,
    });
    const falha = interpretarConsultaPedidoLaquila(
      { sucesso: false, codigoHttp: 503, erro: "Instável" },
      "1133591",
    );
    const atual = atualizarSincronizacaoPedidoLaquila({
      anterior,
      consulta: falha,
      agora: instante,
    });
    assert.deepEqual(atual.ultimoEstado, anterior.ultimoEstado);
    assert.equal(atual.atualizadoEstadoEm, anterior.atualizadoEstadoEm);
    const repetida = atualizarSincronizacaoPedidoLaquila({
      anterior: atual,
      consulta: falha,
      agora: instante,
    });
    assert.equal(repetida.falhasConsecutivas, 2);
    assert.equal(repetida.proximaConsultaEm, "2026-10-21T03:00:00.000Z");
  });
  it("concorrência e invocações repetidas consultam uma única vez", async () => {
    const repo = repositorioMemoria();
    await Promise.all([
      reconciliarPedidosLaquila(repo.dependencias),
      reconciliarPedidosLaquila(repo.dependencias),
    ]);
    await reconciliarPedidosLaquila(repo.dependencias);
    assert.equal(repo.ler().consultas, 1);
    assert.equal(repo.ler().persistencias, 1);
  });
  it("mesmo estado preserva o marco da mudança e registra somente nova consulta", () => {
    const consulta = interpretarConsultaPedidoLaquila(criado, "1133591");
    const anterior = atualizarSincronizacaoPedidoLaquila({
      anterior: null,
      consulta,
      agora: instante,
    });
    const atual = atualizarSincronizacaoPedidoLaquila({
      anterior,
      consulta,
      agora: new Date(instante.getTime() + 3600_000),
    });
    assert.equal(atual.atualizadoEstadoEm, anterior.atualizadoEstadoEm);
    assert.notEqual(atual.consultadoEm, anterior.consultadoEm);
  });
  it("não dispõe de portas de reembolso, pagamento ou criação 00002", async () => {
    const repo = repositorioMemoria();
    repo.alterar(cancelado);
    const antes = { pagamentoStatus: "paid", valor: 2037 };
    await reconciliarPedidosLaquila(repo.dependencias);
    assert.deepEqual(antes, { pagamentoStatus: "paid", valor: 2037 });
    assert.deepEqual(Object.keys(repo.dependencias).sort(), [
      "adquirir",
      "agora",
      "consultar",
      "listar",
      "persistir",
    ]);
  });
});

describe("projeção segura do cancelamento no pedido Nooo", () => {
  const item = { produtoId: "arruela", varianteId: null, quantidade: 1 };
  const grupo = {
    chaveGrupo: "grupo",
    origemExpedicao: "fornecedor",
    fornecedorProvedor: "laquila",
    itens: [item],
  };
  const caso = {
    status: "processing",
    grupos: [grupo],
    itens: [item],
    gruposCancelados: new Set(["grupo"]),
  };
  it("reconhece o cancelamento completo do pedido Laquila sem finanças", () =>
    assert.equal(podeCancelarPedidoPorFornecedor(caso), true));
  it("não cancela pedido misto, grupo pendente ou sem evidência completa", () => {
    assert.equal(
      podeCancelarPedidoPorFornecedor({
        ...caso,
        grupos: [
          grupo,
          { ...grupo, chaveGrupo: "loja", origemExpedicao: "loja" },
        ],
      }),
      false,
    );
    assert.equal(
      podeCancelarPedidoPorFornecedor({ ...caso, gruposCancelados: new Set() }),
      false,
    );
    assert.equal(
      podeCancelarPedidoPorFornecedor({
        ...caso,
        itens: [item, { ...item, produtoId: "outro" }],
      }),
      false,
    );
    assert.equal(
      podeCancelarPedidoPorFornecedor({ ...caso, grupos: [] }),
      false,
    );
  });
  it("não reabre nem cancela outra vez pedido terminal ou já expedido", () => {
    for (const status of [
      "canceled",
      "refunded",
      "expired",
      "shipped",
      "delivered",
    ])
      assert.equal(podeCancelarPedidoPorFornecedor({ ...caso, status }), false);
  });
});
