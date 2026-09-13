import { normalizarLocalidadeEntregaPropria } from "@/features/logistica/lib/entrega-propria/normalizar-localidade-entrega-propria";
import type { NivelGeograficoEntregaPropria } from "@/features/logistica/lib/entrega-propria/resolver-hierarquia-entrega-propria";

import type { EntregaPropriaDestinoProduto } from "./montar-destinos-entrega-propria";

export type NivelAgendaGeograficaAdmin = NivelGeograficoEntregaPropria;

/** Agenda própria gravada para um destino, com suas datas bloqueadas. */
type AgendaPropriaEntrada = {
  cidadeId: number | null;
  regiaoId: number | null;
  bairroId: number | null;
  cepEspecificoId: number | null;
  diasAtendidos: number[];
  horarioCorte: string;
  datasBloqueadas: string[];
};

// Nível da Agenda → tipo de destino usado no cadastro comercial do Produto.
const TIPO_DESTINO_POR_NIVEL = {
  cidade: "cidade",
  regiao: "region",
  bairro: "bairro",
  cep: "cep-especifico",
} as const;

function pertenceAoDestino(
  agenda: AgendaPropriaEntrada,
  nivel: NivelAgendaGeograficaAdmin,
  destinoId: number,
) {
  if (nivel === "cidade") return agenda.cidadeId === destinoId;
  if (nivel === "regiao") return agenda.regiaoId === destinoId;
  if (nivel === "bairro") return agenda.bairroId === destinoId;
  return agenda.cepEspecificoId === destinoId;
}

/**
 * Monta uma página da Agenda Geográfica: para cada destino do nível, mostra a
 * agenda própria (se houver) e a agenda efetiva — própria ou herdada.
 * A agenda efetiva vem de `montarDestinosEntregaPropria` (mesma regra da loja).
 */
export function montarItensAgendaGeografica({
  nivel,
  destinos,
  agendas,
  busca = "",
  pagina = 1,
  porPagina = 30,
}: {
  nivel: NivelAgendaGeograficaAdmin;
  destinos: readonly EntregaPropriaDestinoProduto[];
  agendas: readonly AgendaPropriaEntrada[];
  busca?: string;
  pagina?: number;
  porPagina?: number;
}) {
  const itens = destinos
    .filter((destino) => destino.type === TIPO_DESTINO_POR_NIVEL[nivel])
    .map((destino) => {
      const propria = agendas.find((agenda) =>
        pertenceAoDestino(agenda, nivel, destino.id),
      );
      return {
        tipoDestino: nivel,
        destinoId: destino.id,
        nome: destino.label,
        localidade: `${destino.city}/${destino.state}`,
        agendaPropria: propria
          ? {
              diasAtendidos: propria.diasAtendidos,
              horarioCorte: propria.horarioCorte,
              datasBloqueadas: propria.datasBloqueadas,
            }
          : null,
        agendaEfetiva: destino.agendaEntrega
          ? {
              nivel: destino.agendaEntrega.nivel,
              diasAtendidos: destino.agendaEntrega.diasDaSemana,
              horarioCorte: destino.agendaEntrega.horarioCorte,
              origem: destino.agendaEntrega.origem,
            }
          : null,
      };
    });

  const termo = normalizarLocalidadeEntregaPropria(busca);
  const filtrados = termo
    ? itens.filter((item) =>
        normalizarLocalidadeEntregaPropria(
          `${item.nome} ${item.localidade}`,
        ).includes(termo),
      )
    : itens;
  const limite = Math.min(Math.max(porPagina, 1), 100);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / limite));
  const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);
  const inicio = (paginaAtual - 1) * limite;

  // Apenas a página visível atravessa a fronteira Server → Client.
  return {
    itens: filtrados.slice(inicio, inicio + limite),
    pagina: paginaAtual,
    totalPaginas,
    totalItens: filtrados.length,
  };
}
