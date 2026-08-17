import afirmacoes from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe as descrever, it as verificar } from "node:test";

import type { SnapshotGrupoEntrega } from "@/features/checkout/types/snapshot-frete.types";

import type { TransportadoraLaquila } from "./cliente-laquila";
import { resolverCdTransportadorLaquila } from "./resolver-cd-transportador-laquila";

const catalogo: TransportadoraLaquila[] = [
  { codigo: "17499", descricao: "CORREIO PAC/SEDEX", cnpj: null },
  { codigo: "63993", descricao: "JAD LOG COLETA", cnpj: null },
  { codigo: "17487", descricao: "O PROPRIO", cnpj: null },
  { codigo: "ml-teste", descricao: "MERCADO LIVRE", cnpj: null },
  { codigo: "shopee-teste", descricao: "SHOPEE", cnpj: null },
];

function criarGrupo({
  cepOrigem = "83430000",
  origemExpedicao = "fornecedor",
  fornecedorProvedor = "laquila",
  provedor = "frenet",
  servicoId = "servico",
  servicoNome = "Serviço",
  transportadora = null,
}: Partial<SnapshotGrupoEntrega> &
  Partial<SnapshotGrupoEntrega["entrega"]> = {}): SnapshotGrupoEntrega {
  return {
    chaveGrupo: "expedicao:fornecedor:laquila",
    cepOrigem,
    origemExpedicao,
    fornecedorProvedor,
    necessitaEtiquetaFornecedor: true,
    itens: [],
    entrega: {
      identificadorOpcao: "opcao",
      tipo: "entrega",
      provedor,
      servicoId,
      servicoNome,
      transportadora,
      valorEmCentavos: 1000,
      prazo: "3 dias úteis",
      metadadosRelevantes: null,
    },
  };
}

function resolver(
  grupo = criarGrupo(),
  contexto: Parameters<
    typeof resolverCdTransportadorLaquila
  >[0]["contexto"] = {},
  transportadoras00015 = catalogo,
) {
  return resolverCdTransportadorLaquila({
    grupo,
    contexto,
    transportadoras00015,
    cepOrigemLaquilaEsperado: "83430000",
  });
}

descrever("resolver cd_transportador Laquila", () => {
  verificar("não se aplica a grupo da loja", () => {
    afirmacoes.equal(
      resolver(
        criarGrupo({ origemExpedicao: "loja", fornecedorProvedor: null }),
      ).estado,
      "nao_aplicavel",
    );
  });

  verificar("resolve Correios pelo Carrier da Frenet", () => {
    afirmacoes.equal(
      resolver(criarGrupo({ transportadora: "Correios" })).codigo,
      "17499",
    );
  });

  verificar("resolve PAC pelo ServiceCode estável", () => {
    afirmacoes.equal(
      resolver(criarGrupo({ servicoId: "PAC" })).codigo,
      "17499",
    );
  });

  verificar("resolve SEDEX pelo ServiceCode estável", () => {
    afirmacoes.equal(
      resolver(criarGrupo({ servicoId: "SEDEX" })).codigo,
      "17499",
    );
  });

  verificar("resolve Jadlog pelo Carrier normalizado em um único ponto", () => {
    afirmacoes.equal(
      resolver(criarGrupo({ transportadora: "JAD LOG COLETA" })).codigo,
      "63993",
    );
  });

  verificar("resolve O PROPRIO somente com coleta Laquila explícita", () => {
    afirmacoes.equal(
      resolver(criarGrupo(), {
        operacaoColeta: { tipo: "coleta_propria_laquila" },
      }).codigo,
      "17487",
    );
  });

  verificar("entrega própria da loja não implica O PROPRIO", () => {
    const resultado = resolver(
      criarGrupo({ provedor: "entrega-propria", servicoId: "entrega-propria" }),
    );
    afirmacoes.equal(resultado.estado, "nao_resolvido");
    afirmacoes.equal(resultado.codigo, null);
  });

  verificar("bloqueia grupo Laquila cotado com origem da loja", () => {
    const resultado = resolver(
      criarGrupo({ cepOrigem: "30668635", servicoId: "PAC" }),
      { operacaoColeta: { tipo: "transportadora" } },
    );
    afirmacoes.deepEqual(resultado, {
      estado: "bloqueado",
      codigo: null,
      motivo: "CEP_ORIGEM_LAQUILA_DIVERGENTE",
    });
  });

  verificar("exige entrega Frenet no fluxo ativo da loja própria", () => {
    const resultado = resolver(
      criarGrupo({ provedor: "manual", servicoId: "PAC" }),
      { operacaoColeta: { tipo: "transportadora" } },
    );
    afirmacoes.equal(resultado.estado, "nao_resolvido");
    afirmacoes.equal(resultado.codigo, null);
  });

  verificar("transportadora desconhecida não recebe fallback perigoso", () => {
    const resultado = resolver(
      criarGrupo({ transportadora: "Outra Transportadora" }),
      { operacaoColeta: { tipo: "transportadora" } },
    );
    afirmacoes.equal(resultado.estado, "nao_resolvido");
    afirmacoes.equal(resultado.codigo, null);
  });

  verificar(
    "resolve código ML informado pela etiqueta em pedido Mercado Livre",
    () => {
      afirmacoes.equal(
        resolver(criarGrupo(), {
          contextoPedido: "mercado_livre",
          operacaoColeta: {
            tipo: "marketplace",
            marketplace: "mercado_livre",
            codigoTransportador: "ml-teste",
          },
        }).codigo,
        "ml-teste",
      );
    },
  );

  verificar("bloqueia código ML em pedido da loja própria", () => {
    afirmacoes.equal(
      resolver(criarGrupo(), {
        contextoPedido: "loja_propria",
        operacaoColeta: {
          tipo: "marketplace",
          marketplace: "mercado_livre",
          codigoTransportador: "ml-teste",
        },
      }).estado,
      "bloqueado",
    );
  });

  verificar(
    "resolve código Shopee informado pela etiqueta em pedido Shopee",
    () => {
      afirmacoes.equal(
        resolver(criarGrupo(), {
          contextoPedido: "shopee",
          operacaoColeta: {
            tipo: "marketplace",
            marketplace: "shopee",
            codigoTransportador: "shopee-teste",
          },
        }).codigo,
        "shopee-teste",
      );
    },
  );

  verificar("bloqueia código Shopee em pedido da loja própria", () => {
    afirmacoes.equal(
      resolver(criarGrupo(), {
        contextoPedido: "loja_propria",
        operacaoColeta: {
          tipo: "marketplace",
          marketplace: "shopee",
          codigoTransportador: "shopee-teste",
        },
      }).estado,
      "bloqueado",
    );
  });

  verificar("não se aplica a outro fornecedor", () => {
    afirmacoes.equal(
      resolver(criarGrupo({ fornecedorProvedor: "outro" })).estado,
      "nao_aplicavel",
    );
  });

  verificar(
    "falha de forma controlada se código esperado sumir do catálogo",
    () => {
      const resultado = resolver(
        criarGrupo({ servicoId: "PAC" }),
        {},
        catalogo.filter((item) => item.codigo !== "17499"),
      );
      afirmacoes.deepEqual(resultado, {
        estado: "nao_resolvido",
        codigo: null,
        motivo: "CODIGO_TRANSPORTADOR_AUSENTE_NO_00015",
      });
    },
  );

  verificar("falha se o código Jadlog sumir do catálogo", () => {
    const resultado = resolver(
      criarGrupo({ transportadora: "Jadlog" }),
      { operacaoColeta: { tipo: "transportadora" } },
      catalogo.filter((item) => item.codigo !== "63993"),
    );
    afirmacoes.equal(resultado.estado, "nao_resolvido");
    afirmacoes.equal(resultado.codigo, null);
  });

  verificar("bloqueia marketplace sem código confirmado pela etiqueta", () => {
    afirmacoes.equal(
      resolver(criarGrupo(), {
        contextoPedido: "mercado_livre",
        operacaoColeta: {
          tipo: "marketplace",
          marketplace: "mercado_livre",
          codigoTransportador: " ",
        },
      }).estado,
      "bloqueado",
    );
  });

  verificar(
    "o resolver puro não contém chamadas de criação ou etiqueta",
    () => {
      const fonte = readFileSync(
        new URL("./resolver-cd-transportador-laquila.ts", import.meta.url),
        "utf8",
      );
      afirmacoes.equal(fonte.includes(["000", "02"].join("")), false);
      afirmacoes.equal(fonte.includes(["000", "10"].join("")), false);
    },
  );
});
