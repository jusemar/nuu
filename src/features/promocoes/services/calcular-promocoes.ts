import { entradaCalculoPromocoesSchema } from "../schemas/promocao.schema";
import { calcularDescontoProduto } from "../lib/calcular-desconto-produto";
import { filtrarRegrasPromocaoValidas } from "../lib/filtrar-regras-promocao-validas";
import { normalizarContextoPromocao } from "../lib/normalizar-contexto-promocao";
import { prepararItensPromocao } from "../lib/preparar-itens-promocao";
import { buscarPromocoesValidas } from "../queries/buscar-promocoes-validas";
import type {
  ContextoCalculoPromocao,
  CupomPromocaoCalculavel,
  EscopoPromocaoAplicada,
  EntradaCalculoPromocoes,
  ItemEntradaPromocao,
  PromocaoAplicada,
  RegraPromocaoCalculavel,
  RegraSubtotalPromocaoCalculavel,
  ResultadoCalculoPromocoes,
  TipoDescontoPromocao,
  VinculoCategoriaPromocaoCalculavel,
  VinculoMarcaPromocaoCalculavel,
  VinculoProdutoPromocaoCalculavel,
} from "../types/promocoes.types";

type CandidatoPromocao = {
  regra: RegraPromocaoCalculavel;
  escopo: EscopoPromocaoAplicada;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
  descontoEmCentavos: number;
  codigoCupom: string | null;
  cupomPromocaoId: string | null;
};

function criarIndiceRegrasValidas(
  regras: RegraPromocaoCalculavel[],
): Map<string, RegraPromocaoCalculavel> {
  return new Map(regras.map((regra) => [regra.id, regra]));
}

function buscarCandidatosProduto(
  item: ItemEntradaPromocao,
  regrasValidasPorId: Map<string, RegraPromocaoCalculavel>,
  produtosPromocao: VinculoProdutoPromocaoCalculavel[],
): CandidatoPromocao[] {
  return produtosPromocao
    .filter(
      (produtoPromocao) =>
        produtoPromocao.produtoId === item.produtoId &&
        (!produtoPromocao.modalidade ||
          produtoPromocao.modalidade === item.modalidade),
    )
    .flatMap((produtoPromocao) => {
      const regra = regrasValidasPorId.get(produtoPromocao.regraPromocaoId);

      if (!regra) {
        return [];
      }

      const descontoEmCentavos = calcularDescontoProduto({
        precoBaseEmCentavos: item.precoBaseEmCentavos,
        tipoDesconto: produtoPromocao.tipoDesconto,
        valorDesconto: produtoPromocao.valorDesconto,
      });

      if (descontoEmCentavos <= 0) {
        return [];
      }

      return [
        {
          regra,
          escopo: "produto",
          tipoDesconto: produtoPromocao.tipoDesconto,
          valorDesconto: produtoPromocao.valorDesconto,
          descontoEmCentavos,
          codigoCupom: null,
          cupomPromocaoId: null,
        },
      ];
    });
}

function buscarCandidatosCategoria(
  item: ItemEntradaPromocao,
  regrasValidasPorId: Map<string, RegraPromocaoCalculavel>,
  categoriasPromocao: VinculoCategoriaPromocaoCalculavel[],
): CandidatoPromocao[] {
  if (!item.categoriaId) {
    return [];
  }

  return categoriasPromocao
    .filter(
      (categoriaPromocao) => categoriaPromocao.categoriaId === item.categoriaId,
    )
    .flatMap((categoriaPromocao) => {
      const regra = regrasValidasPorId.get(categoriaPromocao.regraPromocaoId);

      if (!regra) {
        return [];
      }

      const descontoEmCentavos = calcularDescontoProduto({
        precoBaseEmCentavos: item.precoBaseEmCentavos,
        tipoDesconto: categoriaPromocao.tipoDesconto,
        valorDesconto: categoriaPromocao.valorDesconto,
      });

      if (descontoEmCentavos <= 0) {
        return [];
      }

      return [
        {
          regra,
          escopo: "categoria",
          tipoDesconto: categoriaPromocao.tipoDesconto,
          valorDesconto: categoriaPromocao.valorDesconto,
          descontoEmCentavos,
          codigoCupom: null,
          cupomPromocaoId: null,
        },
      ];
    });
}

function buscarCandidatosMarca(
  item: ItemEntradaPromocao,
  regrasValidasPorId: Map<string, RegraPromocaoCalculavel>,
  marcasPromocao: VinculoMarcaPromocaoCalculavel[],
): CandidatoPromocao[] {
  if (!item.marcaId) {
    return [];
  }

  return marcasPromocao
    .filter((marcaPromocao) => marcaPromocao.marcaId === item.marcaId)
    .flatMap((marcaPromocao) => {
      const regra = regrasValidasPorId.get(marcaPromocao.regraPromocaoId);

      if (!regra) {
        return [];
      }

      const descontoEmCentavos = calcularDescontoProduto({
        precoBaseEmCentavos: item.precoBaseEmCentavos,
        tipoDesconto: marcaPromocao.tipoDesconto,
        valorDesconto: marcaPromocao.valorDesconto,
      });

      if (descontoEmCentavos <= 0) {
        return [];
      }

      return [
        {
          regra,
          escopo: "marca",
          tipoDesconto: marcaPromocao.tipoDesconto,
          valorDesconto: marcaPromocao.valorDesconto,
          descontoEmCentavos,
          codigoCupom: null,
          cupomPromocaoId: null,
        },
      ];
    });
}

function subtotalEstaNaFaixa(
  subtotalPromocao: RegraSubtotalPromocaoCalculavel,
  contexto: ContextoCalculoPromocao,
): boolean {
  if (contexto.subtotalEmCentavos === null) {
    return false;
  }

  if (contexto.subtotalEmCentavos < subtotalPromocao.subtotalMinimo) {
    return false;
  }

  return (
    subtotalPromocao.subtotalMaximo === null ||
    contexto.subtotalEmCentavos <= subtotalPromocao.subtotalMaximo
  );
}

function buscarCandidatosSubtotal(
  item: ItemEntradaPromocao,
  contexto: ContextoCalculoPromocao,
  regrasValidasPorId: Map<string, RegraPromocaoCalculavel>,
  subtotaisPromocao: RegraSubtotalPromocaoCalculavel[],
): CandidatoPromocao[] {
  return subtotaisPromocao
    .filter((subtotalPromocao) =>
      subtotalEstaNaFaixa(subtotalPromocao, contexto),
    )
    .flatMap((subtotalPromocao) => {
      const regra = regrasValidasPorId.get(subtotalPromocao.regraPromocaoId);

      if (!regra) {
        return [];
      }

      const descontoEmCentavos = calcularDescontoProduto({
        precoBaseEmCentavos: item.precoBaseEmCentavos,
        tipoDesconto: subtotalPromocao.tipoDesconto,
        valorDesconto: subtotalPromocao.valorDesconto,
      });

      if (descontoEmCentavos <= 0) {
        return [];
      }

      return [
        {
          regra,
          escopo: "subtotal",
          tipoDesconto: subtotalPromocao.tipoDesconto,
          valorDesconto: subtotalPromocao.valorDesconto,
          descontoEmCentavos,
          codigoCupom: null,
          cupomPromocaoId: null,
        },
      ];
    });
}

function criarRegraCalculavelPorCupom(
  cupomPromocao: CupomPromocaoCalculavel,
): RegraPromocaoCalculavel {
  return {
    id: cupomPromocao.id,
    nome: cupomPromocao.nome,
    slug: cupomPromocao.codigo.toLowerCase(),
    status: cupomPromocao.ativo ? "ativa" : "inativa",
    tipoBeneficio: "desconto",
    tipoDesconto: cupomPromocao.tipoDesconto,
    prioridade: cupomPromocao.prioridade,
    acumulativa: cupomPromocao.acumulativo,
    dataInicio: cupomPromocao.dataInicio,
    dataFim: cupomPromocao.dataFim,
    tipoCampanha: "normal",
    badgePromocional: null,
    countdownPromocionalDataFim: null,
  };
}

function resolverMetadadosCampanhaPromocao(
  regra: RegraPromocaoCalculavel,
): Pick<
  PromocaoAplicada,
  "tipoCampanha" | "badgePromocional" | "countdownPromocionalDataFim"
> {
  if (regra.tipoCampanha === "relampago") {
    return {
      tipoCampanha: "relampago",
      badgePromocional: regra.badgePromocional ?? "Oferta relâmpago",
      countdownPromocionalDataFim:
        regra.countdownPromocionalDataFim ?? regra.dataFim,
    };
  }

  return {
    tipoCampanha: "normal",
    badgePromocional: regra.badgePromocional,
    countdownPromocionalDataFim: regra.countdownPromocionalDataFim,
  };
}

function cupomEstaUtilizavel(
  cupomPromocao: CupomPromocaoCalculavel,
  contexto: ContextoCalculoPromocao,
): boolean {
  if (!contexto.codigosCupons.includes(cupomPromocao.codigo)) {
    return false;
  }

  if (!cupomPromocao.ativo) {
    return false;
  }

  if (cupomPromocao.dataInicio > contexto.dataReferencia) {
    return false;
  }

  if (
    cupomPromocao.dataFim &&
    cupomPromocao.dataFim < contexto.dataReferencia
  ) {
    return false;
  }

  if (
    cupomPromocao.limiteUsoTotal !== null &&
    cupomPromocao.totalUsos >= cupomPromocao.limiteUsoTotal
  ) {
    return false;
  }

  if (
    cupomPromocao.limiteUsoPorCliente !== null &&
    cupomPromocao.usosCliente >= cupomPromocao.limiteUsoPorCliente
  ) {
    return false;
  }

  return (
    contexto.subtotalEmCentavos !== null &&
    contexto.subtotalEmCentavos >= cupomPromocao.subtotalMinimo
  );
}

function buscarCandidatosCupom(
  item: ItemEntradaPromocao,
  contexto: ContextoCalculoPromocao,
  cuponsPromocao: CupomPromocaoCalculavel[],
): CandidatoPromocao[] {
  if (contexto.codigosCupons.length === 0) {
    return [];
  }

  return cuponsPromocao
    .filter((cupomPromocao) => cupomEstaUtilizavel(cupomPromocao, contexto))
    .flatMap((cupomPromocao) => {
      const descontoEmCentavos = calcularDescontoProduto({
        precoBaseEmCentavos: item.precoBaseEmCentavos,
        tipoDesconto: cupomPromocao.tipoDesconto,
        valorDesconto: cupomPromocao.valorDesconto,
      });

      if (descontoEmCentavos <= 0) {
        return [];
      }

      return [
        {
          regra: criarRegraCalculavelPorCupom(cupomPromocao),
          escopo: "cupom" as const,
          tipoDesconto: cupomPromocao.tipoDesconto,
          valorDesconto: cupomPromocao.valorDesconto,
          descontoEmCentavos,
          codigoCupom: cupomPromocao.codigo,
          cupomPromocaoId: cupomPromocao.id,
        },
      ];
    });
}

function selecionarMelhorPromocao(
  candidatos: CandidatoPromocao[],
): CandidatoPromocao | null {
  return (
    [...candidatos].sort((candidatoAtual, proximoCandidato) => {
      if (
        proximoCandidato.descontoEmCentavos !==
        candidatoAtual.descontoEmCentavos
      ) {
        return (
          proximoCandidato.descontoEmCentavos -
          candidatoAtual.descontoEmCentavos
        );
      }

      return (
        proximoCandidato.regra.prioridade - candidatoAtual.regra.prioridade
      );
    })[0] ?? null
  );
}

export async function calcularPromocoes(
  entrada: EntradaCalculoPromocoes,
): Promise<ResultadoCalculoPromocoes> {
  const entradaValidada = entradaCalculoPromocoesSchema.parse(entrada);
  const contexto = normalizarContextoPromocao(entradaValidada);
  const possuiPromocoesInjetadas =
    entradaValidada.produtosPromocao ||
    entradaValidada.categoriasPromocao ||
    entradaValidada.marcasPromocao ||
    entradaValidada.subtotaisPromocao ||
    entradaValidada.cuponsPromocao;
  const promocoesDisponiveis = possuiPromocoesInjetadas
    ? {
        regras: entradaValidada.regras ?? [],
        produtosPromocao: entradaValidada.produtosPromocao ?? [],
        categoriasPromocao: entradaValidada.categoriasPromocao ?? [],
        marcasPromocao: entradaValidada.marcasPromocao ?? [],
        subtotaisPromocao: entradaValidada.subtotaisPromocao ?? [],
        cuponsPromocao: entradaValidada.cuponsPromocao ?? [],
      }
    : await buscarPromocoesValidas({
        dataReferencia: contexto.dataReferencia,
        codigosCupons: contexto.codigosCupons,
        clienteId: contexto.clienteId,
      });
  const regrasValidas = filtrarRegrasPromocaoValidas(
    promocoesDisponiveis.regras,
    contexto,
  );
  const regrasValidasPorId = criarIndiceRegrasValidas(regrasValidas);
  const produtosPromocao = promocoesDisponiveis.produtosPromocao;
  const categoriasPromocao = promocoesDisponiveis.categoriasPromocao;
  const marcasPromocao = promocoesDisponiveis.marcasPromocao;
  const subtotaisPromocao = promocoesDisponiveis.subtotaisPromocao;
  const cuponsPromocao = promocoesDisponiveis.cuponsPromocao;
  const regrasAplicadas: PromocaoAplicada[] = [];
  const codigosCuponsEncontrados = new Set(
    cuponsPromocao.map((cupomPromocao) => cupomPromocao.codigo),
  );
  const avisos = contexto.codigosCupons
    .filter((codigoCupom) => !codigosCuponsEncontrados.has(codigoCupom))
    .map((codigoCupom) => `Cupom ${codigoCupom} inválido ou indisponível.`);

  const itens = prepararItensPromocao(entradaValidada.itens).map((item) => {
    const melhorPromocao = selecionarMelhorPromocao([
      ...buscarCandidatosProduto(item, regrasValidasPorId, produtosPromocao),
      ...buscarCandidatosCategoria(
        item,
        regrasValidasPorId,
        categoriasPromocao,
      ),
      ...buscarCandidatosMarca(item, regrasValidasPorId, marcasPromocao),
      ...buscarCandidatosSubtotal(
        item,
        contexto,
        regrasValidasPorId,
        subtotaisPromocao,
      ),
      ...buscarCandidatosCupom(item, contexto, cuponsPromocao),
    ]);

    if (!melhorPromocao) {
      return item;
    }

    const metadadosCampanha = resolverMetadadosCampanhaPromocao(
      melhorPromocao.regra,
    );
    const promocaoAplicada: PromocaoAplicada = {
      regraPromocaoId: melhorPromocao.regra.id,
      cupomPromocaoId: melhorPromocao.cupomPromocaoId,
      nome: melhorPromocao.regra.nome,
      tipoDesconto: melhorPromocao.tipoDesconto,
      valorDescontoEmCentavos: melhorPromocao.descontoEmCentavos,
      valorConfigurado: melhorPromocao.valorDesconto,
      escopo: melhorPromocao.escopo,
      codigoCupom: melhorPromocao.codigoCupom,
      ...metadadosCampanha,
    };
    const precoFinalEmCentavos = Math.max(
      item.precoBaseEmCentavos - melhorPromocao.descontoEmCentavos,
      0,
    );

    regrasAplicadas.push(promocaoAplicada);

    return {
      ...item,
      preco_final: precoFinalEmCentavos,
      desconto_aplicado: melhorPromocao.descontoEmCentavos,
      regra_aplicada: melhorPromocao.regra.id,
      tipo_desconto: melhorPromocao.tipoDesconto,
      valor_desconto: melhorPromocao.valorDesconto,
      escopo_promocao: melhorPromocao.escopo,
      descontoEmCentavos: melhorPromocao.descontoEmCentavos,
      precoFinalEmCentavos,
      tipoCampanha: metadadosCampanha.tipoCampanha,
      badgePromocional: metadadosCampanha.badgePromocional,
      countdownPromocionalDataFim:
        metadadosCampanha.countdownPromocionalDataFim,
      promocoesAplicadas: [promocaoAplicada],
    };
  });

  const totalDescontoEmCentavos = itens.reduce(
    (total, item) => total + item.descontoEmCentavos * item.quantidade,
    0,
  );

  return {
    sucesso: true,
    contexto,
    itens,
    totalDescontoEmCentavos,
    regrasAvaliadas: regrasValidas,
    regrasAplicadas,
    avisos,
  };
}
