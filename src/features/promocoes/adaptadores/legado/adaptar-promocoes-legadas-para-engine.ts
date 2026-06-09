import { createHash } from "node:crypto";

import type {
  CampanhaPromocionalLegadaAdaptada,
  OpcoesAdaptacaoPromocoesLegadas,
  PromocaoLegadaEntrada,
  ResultadoAdaptacaoPromocoesLegadas,
  TipoPromocaoLegada,
} from "../../types/promocoes-legadas.types";
import type {
  RegraPromocaoCalculavel,
  StatusPromocao,
  VinculoProdutoPromocaoCalculavel,
} from "../../types/promocoes.types";

function criarUuidDeterministicoLegado(valor: string) {
  const hash = createHash("sha1").update(valor).digest("hex").slice(0, 32);

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
      .toString(16)
      .padStart(2, "0")}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function converterDataLegada(data: Date | string | null | undefined) {
  if (!data) return null;

  const dataConvertida = data instanceof Date ? data : new Date(data);

  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function normalizarTipoPromocaoLegada(
  tipo: PromocaoLegadaEntrada["promoType"],
): TipoPromocaoLegada {
  return tipo === "flash" ? "flash" : "normal";
}

function resolverStatusPromocaoLegada({
  tipoPromocao,
  dataFim,
  dataReferencia,
}: {
  tipoPromocao: TipoPromocaoLegada;
  dataFim: Date | null;
  dataReferencia: Date;
}): StatusPromocao {
  if (
    tipoPromocao === "flash" &&
    dataFim &&
    dataFim.getTime() <= dataReferencia.getTime()
  ) {
    return "encerrada";
  }

  return "ativa";
}

function criarSlugLegado({
  produtoId,
  modalidade,
  tipoPromocao,
}: {
  produtoId: string;
  modalidade: string;
  tipoPromocao: TipoPromocaoLegada;
}) {
  const identificador = criarUuidDeterministicoLegado(
    `slug:${produtoId}:${modalidade}:${tipoPromocao}`,
  ).slice(0, 8);

  return `legado-${tipoPromocao}-${modalidade}-${identificador}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function calcularPrioridadeLegada({
  tipoPromocao,
  mainCardPrice,
}: {
  tipoPromocao: TipoPromocaoLegada;
  mainCardPrice?: boolean | null;
}) {
  const prioridadeBase = tipoPromocao === "flash" ? 900 : 500;

  return prioridadeBase + (mainCardPrice ? 10 : 0);
}

function criarCampanhaLegada({
  entrada,
  regra,
  tipoPromocao,
  dataFim,
  status,
  descontoEmCentavos,
}: {
  entrada: PromocaoLegadaEntrada;
  regra: RegraPromocaoCalculavel;
  tipoPromocao: TipoPromocaoLegada;
  dataFim: Date | null;
  status: StatusPromocao;
  descontoEmCentavos: number;
}): CampanhaPromocionalLegadaAdaptada {
  const ofertaRelampago = tipoPromocao === "flash";

  return {
    id: criarUuidDeterministicoLegado(
      `campanha:${entrada.produtoId}:${entrada.modalidade}:${tipoPromocao}`,
    ),
    regraPromocaoId: regra.id,
    produtoId: entrada.produtoId,
    modalidade: entrada.modalidade,
    tipoCampanha: ofertaRelampago ? "oferta_relampago" : "promocao_normal",
    tipoPromocaoLegada: tipoPromocao,
    status,
    badge: ofertaRelampago ? "relampago" : "promocao",
    countdown: {
      ativo: ofertaRelampago && status === "ativa" && Boolean(dataFim),
      dataFim,
    },
    precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
    precoPromocionalEmCentavos: entrada.promoPrice!,
    descontoEmCentavos,
    origem: "product_pricing",
  };
}

function adaptarPromocaoLegada({
  entrada,
  dataReferencia,
}: {
  entrada: PromocaoLegadaEntrada;
  dataReferencia: Date;
}) {
  if (entrada.legadoPromocaoMigradoEm) {
    return {
      aviso: `Promocao legada ignorada: produto ${entrada.produtoId} ja migrado para regra oficial.`,
      regra: null,
      produtoPromocao: null,
      campanha: null,
    };
  }

  if (!entrada.hasPromo) {
    return {
      aviso: `Promocao legada ignorada: produto ${entrada.produtoId} sem hasPromo ativo.`,
      regra: null,
      produtoPromocao: null,
      campanha: null,
    };
  }

  if (
    entrada.precoBaseEmCentavos <= 0 ||
    !entrada.promoPrice ||
    entrada.promoPrice <= 0
  ) {
    return {
      aviso: `Promocao legada ignorada: produto ${entrada.produtoId} sem preco valido.`,
      regra: null,
      produtoPromocao: null,
      campanha: null,
    };
  }

  const descontoEmCentavos = Math.max(
    entrada.precoBaseEmCentavos - entrada.promoPrice,
    0,
  );

  if (descontoEmCentavos <= 0) {
    return {
      aviso: `Promocao legada ignorada: produto ${entrada.produtoId} sem beneficio real.`,
      regra: null,
      produtoPromocao: null,
      campanha: null,
    };
  }

  const tipoPromocao = normalizarTipoPromocaoLegada(entrada.promoType);
  const dataFim = converterDataLegada(entrada.promoEndDate);
  const status = resolverStatusPromocaoLegada({
    tipoPromocao,
    dataFim,
    dataReferencia,
  });
  const chaveLegada =
    entrada.idPrecoLegado ??
    `${entrada.produtoId}:${entrada.modalidade}:${tipoPromocao}`;
  const regra: RegraPromocaoCalculavel = {
    id: criarUuidDeterministicoLegado(`regra:${chaveLegada}`),
    nome:
      tipoPromocao === "flash"
        ? "Oferta relampago legada"
        : "Promocao normal legada",
    slug: criarSlugLegado({
      produtoId: entrada.produtoId,
      modalidade: entrada.modalidade,
      tipoPromocao,
    }),
    status,
    tipoBeneficio: "desconto",
    tipoDesconto: "valor_fixo",
    prioridade: calcularPrioridadeLegada({
      tipoPromocao,
      mainCardPrice: entrada.mainCardPrice,
    }),
    acumulativa: false,
    dataInicio: new Date(0),
    dataFim,
    tipoCampanha: tipoPromocao === "flash" ? "relampago" : "normal",
    badgePromocional:
      tipoPromocao === "flash" ? "Oferta relâmpago" : "Promoção",
    countdownPromocionalDataFim: tipoPromocao === "flash" ? dataFim : null,
  };
  const produtoPromocao: VinculoProdutoPromocaoCalculavel = {
    id: criarUuidDeterministicoLegado(`vinculo:${chaveLegada}`),
    regraPromocaoId: regra.id,
    produtoId: entrada.produtoId,
    modalidade: entrada.modalidade,
    tipoDesconto: "valor_fixo",
    valorDesconto: descontoEmCentavos,
  };
  const campanha = criarCampanhaLegada({
    entrada,
    regra,
    tipoPromocao,
    dataFim,
    status,
    descontoEmCentavos,
  });

  return {
    aviso: null,
    regra,
    produtoPromocao,
    campanha,
  };
}

export function adaptarPromocoesLegadasParaEngine(
  entradas: PromocaoLegadaEntrada[],
  opcoes: OpcoesAdaptacaoPromocoesLegadas = {},
): ResultadoAdaptacaoPromocoesLegadas {
  const dataReferencia = opcoes.dataReferencia ?? new Date();
  const regras: RegraPromocaoCalculavel[] = [];
  const produtosPromocao: VinculoProdutoPromocaoCalculavel[] = [];
  const campanhas: CampanhaPromocionalLegadaAdaptada[] = [];
  const avisos: string[] = [];

  entradas.forEach((entrada) => {
    const resultado = adaptarPromocaoLegada({
      entrada,
      dataReferencia,
    });

    if (resultado.aviso) {
      avisos.push(resultado.aviso);
    }

    if (resultado.regra && resultado.produtoPromocao && resultado.campanha) {
      regras.push(resultado.regra);
      produtosPromocao.push(resultado.produtoPromocao);
      campanhas.push(resultado.campanha);
    }
  });

  return {
    regras,
    produtosPromocao,
    campanhas,
    avisos,
  };
}
