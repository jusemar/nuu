import {
  esquemaResultadoCotacaoFrenet,
  type ServicoCotacaoFrenet,
} from "../../../schemas/contratos-frenet";
import type {
  OpcaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../../types/contratos-frete";
import type { ConfiguracaoProvedorFreteFrenet } from "../criar-provedor-frete-frenet";

export type ResultadoConsultaCotacaoFrenet = {
  opcoes: OpcaoFrete[];
  avisos: string[];
};

export type FuncaoHttpFrenet = typeof fetch;

export class ErroCotacaoFrenet extends Error {
  constructor(
    public readonly codigo:
      | "cotacao-frenet-timeout"
      | "cotacao-frenet-api-indisponivel"
      | "resposta-frenet-invalida",
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroCotacaoFrenet";
  }
}

function obterValorDeclaradoEmReais(solicitacao: SolicitacaoCotacaoFrete) {
  const valorEmCentavos = solicitacao.itens.reduce((total, item) => {
    return (
      total +
      (item.valorDeclaradoEmCentavos ?? 0) * Math.max(item.quantidade, 1)
    );
  }, 0);

  return Number((valorEmCentavos / 100).toFixed(2));
}

export function montarRequisicaoCotacaoFrenet(
  solicitacao: SolicitacaoCotacaoFrete,
  configuracao: ConfiguracaoProvedorFreteFrenet,
) {
  return {
    SellerCEP: configuracao.cepOrigem,
    RecipientCEP: solicitacao.destino.cep,
    RecipientCountry: solicitacao.destino.pais,
    ShipmentInvoiceValue: obterValorDeclaradoEmReais(solicitacao),
    ShippingItemArray: solicitacao.itens.map((item) => ({
      Height: item.dimensoes.alturaEmCm,
      Length: item.dimensoes.comprimentoEmCm,
      Quantity: item.quantidade,
      SKU: item.codigoSku ?? item.produtoId,
      Weight: Number((item.pesoEmGramas / 1000).toFixed(3)),
      Width: item.dimensoes.larguraEmCm,
    })),
  };
}

function converterNumero(valor: unknown) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  if (typeof valor !== "string") {
    return null;
  }

  const normalizado = valor.trim().replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

function servicoTemErro(servico: ServicoCotacaoFrenet) {
  return (
    servico.Error === true ||
    servico.Error === 1 ||
    servico.Error === "1" ||
    servico.Error === "true"
  );
}

function normalizarTexto(valor: string | null | undefined) {
  return valor?.trim() || null;
}

function obterServicosCotacaoFrenet(
  resultado: ReturnType<typeof esquemaResultadoCotacaoFrenet.parse>,
) {
  return (
    resultado.ShippingSevicesArray ?? resultado.ShippingServicesArray ?? []
  );
}

function criarIdentificadorOpcaoFrenet(
  solicitacao: SolicitacaoCotacaoFrete,
  servico: ServicoCotacaoFrenet,
  indice: number,
) {
  const codigoServico =
    normalizarTexto(servico.ServiceCode) || `servico-${indice}`;

  return `frenet:${solicitacao.identificador}:${codigoServico}`;
}

function criarOpcaoFrenet(
  solicitacao: SolicitacaoCotacaoFrete,
  servico: ServicoCotacaoFrenet,
  indice: number,
): OpcaoFrete | null {
  if (servicoTemErro(servico)) {
    return null;
  }

  const codigoServico = normalizarTexto(servico.ServiceCode);
  const valorEmReais = converterNumero(servico.ShippingPrice);
  const prazo = converterNumero(servico.DeliveryTime);

  if (!codigoServico || valorEmReais === null || valorEmReais < 0) {
    return null;
  }

  const nomeServico =
    normalizarTexto(servico.ServiceDescription) ||
    normalizarTexto(servico.Carrier) ||
    "Entrega Frenet";

  return {
    identificador: criarIdentificadorOpcaoFrenet(solicitacao, servico, indice),
    provedor: "frenet",
    servico: codigoServico,
    nome: nomeServico,
    tipo: "entrega",
    valorEmCentavos: Math.round(valorEmReais * 100),
    prazoMinimoEmDiasUteis:
      prazo !== null && prazo >= 0 ? Math.trunc(prazo) : null,
    prazoMaximoEmDiasUteis:
      prazo !== null && prazo >= 0 ? Math.trunc(prazo) : null,
    descricao:
      prazo !== null && prazo >= 0 ? `${Math.trunc(prazo)} dias uteis` : null,
    metadados: {
      transportadora: normalizarTexto(servico.Carrier),
      valorOriginal: converterNumero(servico.OriginalShippingPrice),
      prazoOriginal: converterNumero(servico.OriginalDeliveryTime),
    },
  };
}

function normalizarServicosCotacaoFrenet(
  solicitacao: SolicitacaoCotacaoFrete,
  servicos: ServicoCotacaoFrenet[],
): ResultadoConsultaCotacaoFrenet {
  const opcoes = servicos
    .map((servico, indice) => criarOpcaoFrenet(solicitacao, servico, indice))
    .filter((opcao): opcao is OpcaoFrete => Boolean(opcao));

  return {
    opcoes,
    avisos:
      opcoes.length > 0
        ? []
        : ["A Frenet nao retornou servicos disponiveis para esta cotacao."],
  };
}

function erroFoiAbortado(erro: unknown) {
  return (
    erro instanceof Error &&
    (erro.name === "AbortError" || erro.message.includes("aborted"))
  );
}

export async function consultarCotacaoFrenet(
  solicitacao: SolicitacaoCotacaoFrete,
  configuracao: ConfiguracaoProvedorFreteFrenet,
  funcaoHttp: FuncaoHttpFrenet = fetch,
): Promise<ResultadoConsultaCotacaoFrenet> {
  const controle = new AbortController();
  const timeout = setTimeout(() => controle.abort(), configuracao.timeoutEmMs);

  try {
    const resposta = await funcaoHttp(configuracao.urlCotacao, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: configuracao.token,
      },
      body: JSON.stringify(
        montarRequisicaoCotacaoFrenet(solicitacao, configuracao),
      ),
      signal: controle.signal,
    });

    if (!resposta.ok) {
      throw new ErroCotacaoFrenet(
        "cotacao-frenet-api-indisponivel",
        "A API da Frenet nao concluiu a cotacao.",
      );
    }

    const conteudo = await resposta.json();
    const validacao = esquemaResultadoCotacaoFrenet.safeParse(conteudo);

    if (!validacao.success) {
      throw new ErroCotacaoFrenet(
        "resposta-frenet-invalida",
        "A Frenet retornou uma resposta invalida.",
      );
    }

    return normalizarServicosCotacaoFrenet(
      solicitacao,
      obterServicosCotacaoFrenet(validacao.data),
    );
  } catch (erro) {
    if (erroFoiAbortado(erro)) {
      throw new ErroCotacaoFrenet(
        "cotacao-frenet-timeout",
        "A cotacao da Frenet excedeu o tempo limite.",
      );
    }

    if (erro instanceof ErroCotacaoFrenet) {
      throw erro;
    }

    throw new ErroCotacaoFrenet(
      "cotacao-frenet-api-indisponivel",
      "A Frenet esta indisponivel para cotacao.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
