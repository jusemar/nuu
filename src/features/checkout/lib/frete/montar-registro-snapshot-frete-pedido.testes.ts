import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { SnapshotFreteCheckout } from "./revalidar-frete-checkout";
import { montarRegistroSnapshotFretePedido } from "./montar-registro-snapshot-frete-pedido";

const snapshot: SnapshotFreteCheckout = {
  versao: "1",
  cep: "30140071",
  valorTotalEmCentavos: 1800,
  fallbackAcionado: false,
  itens: [
    {
      itemCarrinhoId: "item-1",
      produtoId: "produto-1",
      varianteId: "variante-1",
      provedor: "entrega-propria",
      servico: "entrega-propria-atual",
      modalidade: "entrega",
      valorEmCentavos: 1800,
      prazo: "Hoje",
      itensLogisticos: [],
      pacotes: [],
      metadataResumida: {
        origem: "fluxo-atual",
      },
      fallbackAcionado: false,
    },
  ],
};

descrever("montarRegistroSnapshotFretePedido", () => {
  verificar("monta persistencia consistente com a revalidacao", () => {
    const registro = montarRegistroSnapshotFretePedido({
      pedidoId: "pedido-1",
      snapshot,
    });

    afirmacoes.deepEqual(registro, {
      pedidoId: "pedido-1",
      provedorFrete: "entrega-propria",
      modalidadeFrete: "entrega",
      valorFreteEmCentavos: 1800,
      prazoFrete: "Hoje",
      cepFrete: "30140071",
      fallbackFreteUtilizado: false,
      snapshotFrete: snapshot,
      metadata: {
        origem: "checkout",
        snapshotFreteVersao: "1",
      },
    });
  });

  verificar("resume multiplos provedores e fallback", () => {
    const registro = montarRegistroSnapshotFretePedido({
      pedidoId: "pedido-2",
      snapshot: {
        ...snapshot,
        fallbackAcionado: true,
        itens: [
          snapshot.itens[0]!,
          {
            ...snapshot.itens[0]!,
            itemCarrinhoId: "item-2",
            provedor: "provedor-alternativo",
            fallbackAcionado: true,
          },
        ],
      },
    });

    afirmacoes.equal(registro.provedorFrete, "multiplos");
    afirmacoes.equal(registro.fallbackFreteUtilizado, true);
  });

  verificar("mantem snapshot Frenet auditavel no pedido", () => {
    const snapshotFrenet: SnapshotFreteCheckout = {
      ...snapshot,
      valorTotalEmCentavos: 2490,
      itens: [
        {
          ...snapshot.itens[0]!,
          provedor: "frenet",
          servico: "SEDEX",
          valorEmCentavos: 2490,
          prazo: "3 dias uteis",
          metadataResumida: {
            transportadora: "Correios",
          },
          itensLogisticos: [
            {
              identificador: "item-logistico",
              produtoId: "produto-1",
              varianteId: "variante-1",
              nome: "Produto",
              quantidade: 1,
              pesoEmGramas: 700,
              dimensoes: {
                alturaEmCm: 7,
                larguraEmCm: 12,
                comprimentoEmCm: 20,
              },
            },
          ],
          pacotes: [
            {
              identificador: "pacote-1",
              itens: [],
              quantidadeVolumes: 1,
              pesoTotalEmGramas: 700,
              dimensoes: {
                alturaEmCm: 7,
                larguraEmCm: 12,
                comprimentoEmCm: 20,
              },
            },
          ],
        },
      ],
    };

    const registro = montarRegistroSnapshotFretePedido({
      pedidoId: "pedido-frenet",
      snapshot: snapshotFrenet,
    });

    afirmacoes.equal(registro.provedorFrete, "frenet");
    afirmacoes.equal(registro.prazoFrete, "3 dias uteis");
    afirmacoes.equal(registro.valorFreteEmCentavos, 2490);
    afirmacoes.equal(
      registro.snapshotFrete.itens[0]?.metadataResumida?.transportadora,
      "Correios",
    );
    afirmacoes.equal(
      registro.snapshotFrete.itens[0]?.pacotes[0]?.pesoTotalEmGramas,
      700,
    );
  });
});
