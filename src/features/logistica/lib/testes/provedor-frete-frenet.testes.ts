import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import {
  consultarCotacaoFrenet,
  ErroCotacaoFrenet,
  montarRequisicaoCotacaoFrenet,
  type FuncaoHttpFrenet,
} from "../provedores/frenet/consultar-cotacao-frenet";
import {
  criarProvedorFreteFrenet,
  type ConfiguracaoProvedorFreteFrenet,
} from "../provedores/criar-provedor-frete-frenet";
import type { SolicitacaoCotacaoFrete } from "../../types/contratos-frete";

const configuracao: ConfiguracaoProvedorFreteFrenet = {
  token: "token-frenet",
  cepOrigem: "30140071",
  urlCotacao: "https://api.frenet.com.br/shipping/quote",
  timeoutEmMs: 50,
  ambiente: "teste",
};

const solicitacaoSimples: SolicitacaoCotacaoFrete = {
  identificador: "cotacao-frenet",
  destino: {
    cep: "01310930",
    pais: "BR",
  },
  itens: [
    {
      identificador: "item-simples",
      produtoId: "produto-simples",
      nome: "Produto simples",
      codigoSku: "SKU-SIMPLES",
      quantidade: 2,
      pesoEmGramas: 750,
      valorDeclaradoEmCentavos: 4500,
      dimensoes: {
        alturaEmCm: 5,
        larguraEmCm: 12,
        comprimentoEmCm: 20,
      },
    },
  ],
  pacotes: [],
  moeda: "BRL",
};

const solicitacaoVariante: SolicitacaoCotacaoFrete = {
  ...solicitacaoSimples,
  identificador: "cotacao-variante",
  itens: [
    {
      ...solicitacaoSimples.itens[0]!,
      identificador: "item-variante",
      varianteId: "variante-azul",
      codigoSku: "SKU-AZUL",
      pesoEmGramas: 920,
    },
  ],
};

function criarRespostaJson(conteudo: unknown, status = 200) {
  return new Response(JSON.stringify(conteudo), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function criarServicoDisponivel() {
  return {
    ServiceCode: "SEDEX",
    ServiceDescription: "Sedex",
    Carrier: "Correios",
    ShippingPrice: "24.90",
    OriginalShippingPrice: "29.90",
    DeliveryTime: "3",
    OriginalDeliveryTime: "4",
    Error: false,
  };
}

descrever("provider Frenet", () => {
  verificar("mapeia requisicao de produto simples", () => {
    const requisicao = montarRequisicaoCotacaoFrenet(
      solicitacaoSimples,
      configuracao,
    );

    afirmacoes.deepEqual(requisicao, {
      SellerCEP: "30140071",
      RecipientCEP: "01310930",
      RecipientCountry: "BR",
      ShipmentInvoiceValue: 90,
      ShippingItemArray: [
        {
          Height: 5,
          Length: 20,
          Quantity: 2,
          SKU: "SKU-SIMPLES",
          Weight: 0.75,
          Width: 12,
        },
      ],
    });
  });

  verificar("mapeia variante pela solicitacao logistica", () => {
    const requisicao = montarRequisicaoCotacaoFrenet(
      solicitacaoVariante,
      configuracao,
    );

    afirmacoes.equal(requisicao.ShippingItemArray[0]?.SKU, "SKU-AZUL");
    afirmacoes.equal(requisicao.ShippingItemArray[0]?.Weight, 0.92);
  });

  verificar("retorna opcoes de servico com prazo", async () => {
    const resultado = await consultarCotacaoFrenet(
      solicitacaoSimples,
      configuracao,
      async () =>
        criarRespostaJson({
          ShippingSevicesArray: [criarServicoDisponivel()],
        }),
    );

    afirmacoes.equal(resultado.opcoes.length, 1);
    afirmacoes.deepEqual(resultado.opcoes[0], {
      identificador: "frenet:cotacao-frenet:SEDEX",
      provedor: "frenet",
      servico: "SEDEX",
      nome: "Sedex",
      tipo: "entrega",
      valorEmCentavos: 2490,
      prazoMinimoEmDiasUteis: 3,
      prazoMaximoEmDiasUteis: 3,
      descricao: "3 dias uteis",
      metadados: {
        transportadora: "Correios",
        valorOriginal: 29.9,
        prazoOriginal: 4,
      },
    });
  });

  verificar("trata indisponibilidade de servicos", async () => {
    const resultado = await consultarCotacaoFrenet(
      solicitacaoSimples,
      configuracao,
      async () =>
        criarRespostaJson({
          ShippingSevicesArray: [
            {
              ...criarServicoDisponivel(),
              Error: true,
              Msg: "Servico indisponivel.",
            },
          ],
        }),
    );

    afirmacoes.deepEqual(resultado.opcoes, []);
    afirmacoes.equal(resultado.avisos.length, 1);
  });

  verificar("retorna indisponibilidade para CEP sem servicos", async () => {
    const resultado = await consultarCotacaoFrenet(
      solicitacaoSimples,
      configuracao,
      async () =>
        criarRespostaJson({
          ShippingSevicesArray: [],
        }),
    );

    afirmacoes.deepEqual(resultado.opcoes, []);
    afirmacoes.match(resultado.avisos[0] ?? "", /servicos disponiveis/);
  });

  verificar("converte timeout em erro controlado", async () => {
    const funcaoHttp: FuncaoHttpFrenet = (_, init) =>
      new Promise<Response>((_, rejeitar) => {
        init?.signal?.addEventListener("abort", () => {
          const erro = new Error("aborted");
          erro.name = "AbortError";
          rejeitar(erro);
        });
      });

    await afirmacoes.rejects(
      consultarCotacaoFrenet(
        solicitacaoSimples,
        {
          ...configuracao,
          timeoutEmMs: 1,
        },
        funcaoHttp,
      ),
      (erro: unknown) =>
        erro instanceof ErroCotacaoFrenet &&
        erro.codigo === "cotacao-frenet-timeout",
    );
  });

  verificar("retorna erro do provider quando a API falha", async () => {
    const eventos: string[] = [];
    const provedor = criarProvedorFreteFrenet(configuracao, {
      funcaoHttp: async () => criarRespostaJson({}, 503),
      registrarEvento(evento) {
        eventos.push(evento.tipo);
      },
    });

    const resultado = await provedor.cotarFrete(solicitacaoSimples);

    afirmacoes.equal(resultado.sucesso, false);
    if (resultado.sucesso) return;

    afirmacoes.equal(
      resultado.erros[0]?.codigo,
      "cotacao-frenet-api-indisponivel",
    );
    afirmacoes.deepEqual(eventos, ["erro-api"]);
  });
});
