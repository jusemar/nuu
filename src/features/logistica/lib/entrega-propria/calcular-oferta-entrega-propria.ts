import { adaptarPrecoEntregaPropriaParaHierarquia } from "./adaptar-preco-entrega-propria";
import {
  calcularPromessaEntregaProgramada,
  type PromessaEntregaProgramada,
} from "./calcular-promessa-entrega-programada";
import {
  calcularPromessaEntregaPropria,
  type PromessaEntregaPropria,
} from "./calcular-promessa-entrega-propria";
import {
  type IdentificadoresGeograficosEntregaPropria,
  type NivelGeograficoEntregaPropria,
  resolverRegistroGeograficoEntregaPropria,
} from "./resolver-hierarquia-entrega-propria";

/** Agenda Geográfica: define QUANDO (dias e corte). Nunca define preço. */
export type AgendaGeograficaParaCalculo = {
  id: string;
  tipoDestino: NivelGeograficoEntregaPropria;
  cidadeId?: number | null;
  regiaoId?: number | null;
  bairroId?: number | null;
  cepEspecificoId?: number | null;
  diasAtendidos: number[];
  horarioCorte: string;
  datasBloqueadas: string[];
};

/** Configuração comercial do Produto por destino (nomes físicos da tabela). */
export type PrecoProdutoParaCalculo = {
  destinationType: string;
  cityId?: number | null;
  regionId?: number | null;
  bairroId?: number | null;
  cepEspecificoId?: number | null;
  shippingPrice: number;
  rapidDeliveryActive: boolean;
  deliveryDeadline: string | null;
  scheduledDeliveryActive: boolean;
  scheduledDeliveryMinDays: number | null;
  scheduledDeliveryPrice: number | null;
};

export type OfertaEntregaPropria<P extends PrecoProdutoParaCalculo> =
  | {
      disponivel: true;
      nivelAgenda: NivelGeograficoEntregaPropria;
      nivelPreco: NivelGeograficoEntregaPropria;
      agenda: AgendaGeograficaParaCalculo;
      preco: P;
      valorRapidaEmCentavos: number | null;
      promessaRapida: PromessaEntregaPropria | null;
      entregaProgramada: {
        valorEmCentavos: number;
        promessa: PromessaEntregaProgramada;
      } | null;
    }
  | {
      disponivel: false;
      motivo: "sem-agenda" | "sem-preco" | "sem-modalidade";
    };

/** Resolve a agenda efetiva do destino: CEP > Bairro > Região > Cidade. */
export function resolverAgendaGeograficaEntregaPropria<
  A extends Omit<AgendaGeograficaParaCalculo, "datasBloqueadas">,
>(agendas: readonly A[], ids: IdentificadoresGeograficosEntregaPropria) {
  return resolverRegistroGeograficoEntregaPropria(agendas, ids);
}

/**
 * Motor único da Entrega Própria, sem banco e sem React:
 * geografia → Agenda Geográfica → configuração comercial do Produto → cálculo.
 *
 * - A agenda e o preço são resolvidos de forma INDEPENDENTE, cada um com a
 *   própria precedência (ex.: preço da cidade + agenda da região).
 * - A rápida considera agenda + corte. A programada avança N próximas datas
 *   válidas a partir da rápida, sem reaplicar o corte.
 * - Programada com valor 0 é uma oferta válida (exibida como grátis).
 */
export function calcularOfertaEntregaPropria<
  P extends PrecoProdutoParaCalculo,
>({
  ids,
  agendas,
  precos,
  dataReferencia = new Date(),
}: {
  ids: IdentificadoresGeograficosEntregaPropria;
  agendas: readonly AgendaGeograficaParaCalculo[];
  precos: readonly P[];
  dataReferencia?: Date;
}): OfertaEntregaPropria<P> {
  const agendaResolvida = resolverAgendaGeograficaEntregaPropria(agendas, ids);
  if (!agendaResolvida) return { disponivel: false, motivo: "sem-agenda" };

  const precoResolvido = resolverRegistroGeograficoEntregaPropria(
    precos.map(adaptarPrecoEntregaPropriaParaHierarquia),
    ids,
  );
  if (!precoResolvido) return { disponivel: false, motivo: "sem-preco" };

  const agenda = agendaResolvida.registro;
  const preco = precoResolvido.registro;
  const configuracaoAgenda = {
    ativa: true,
    diasDaSemana: agenda.diasAtendidos,
    horarioCorte: agenda.horarioCorte,
  };

  // A promessa rápida é a "janela zero": base também para a programada.
  const promessaBase = calcularPromessaEntregaPropria({
    agenda: configuracaoAgenda,
    feriados: agenda.datasBloqueadas,
    dataReferencia,
  });
  const promessaRapida = preco.rapidDeliveryActive ? promessaBase : null;
  const promessaProgramada =
    preco.scheduledDeliveryActive &&
    preco.scheduledDeliveryMinDays !== null &&
    preco.scheduledDeliveryPrice !== null
      ? calcularPromessaEntregaProgramada({
          agenda: configuracaoAgenda,
          promessaRapida: promessaBase,
          quantidadeJanelasAposRapida: preco.scheduledDeliveryMinDays,
          datasBloqueadas: agenda.datasBloqueadas,
          dataReferencia,
        })
      : null;

  if (!promessaRapida && !promessaProgramada) {
    return { disponivel: false, motivo: "sem-modalidade" };
  }

  return {
    disponivel: true,
    nivelAgenda: agendaResolvida.nivel,
    nivelPreco: precoResolvido.nivel,
    agenda,
    // O adaptador preserva todos os campos originais do produto.
    preco,
    valorRapidaEmCentavos: promessaRapida ? preco.shippingPrice : null,
    promessaRapida,
    entregaProgramada:
      promessaProgramada && preco.scheduledDeliveryPrice !== null
        ? {
            valorEmCentavos: preco.scheduledDeliveryPrice,
            promessa: promessaProgramada,
          }
        : null,
  };
}
