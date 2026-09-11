export type TipoDestinoPoliticaEntregaPropria =
  | "cep"
  | "bairro"
  | "regiao"
  | "cidade"
  | "uf";

export type PoliticaEntregaPropriaResolucao = {
  id: string;
  escopo: "produto" | "categoria";
  produtoId: string | null;
  categoriaId: string | null;
  incluirDescendentes: boolean;
  ativa: boolean;
  entregaRapidaAtiva: boolean;
  entregaProgramadaAtiva: boolean;
  diasAtendidos: number[];
  horarioCorte: string | null;
  prazoMinimoProgramadaDias: number | null;
  permiteRetirada?: boolean | null;
  modeloRetiradaId?: string | null;
};

export type PrecoPoliticaEntregaPropriaResolucao = {
  politicaId: string;
  tipoDestino: TipoDestinoPoliticaEntregaPropria;
  destinoIdOuUf: string;
  precoRapidaEmCentavos: number | null;
  precoProgramadaEmCentavos: number | null;
  ativa: boolean;
};

export type ContextoResolucaoPoliticaEntregaPropria = {
  produtoId: string;
  categoriaId: string;
  ancestraisCategoriaIds: string[];
  destinos: Partial<Record<TipoDestinoPoliticaEntregaPropria, string>>;
};

const PRECEDENCIA_DESTINO: TipoDestinoPoliticaEntregaPropria[] = [
  "cep",
  "bairro",
  "regiao",
  "cidade",
  "uf",
];

function distanciaCategoria(
  politica: PoliticaEntregaPropriaResolucao,
  contexto: ContextoResolucaoPoliticaEntregaPropria,
) {
  if (politica.categoriaId === contexto.categoriaId) return 0;
  if (!politica.incluirDescendentes || !politica.categoriaId) return null;
  const indice = contexto.ancestraisCategoriaIds.indexOf(politica.categoriaId);
  return indice < 0 ? null : indice + 1;
}

function ordenarPoliticas(
  politicas: PoliticaEntregaPropriaResolucao[],
  contexto: ContextoResolucaoPoliticaEntregaPropria,
) {
  return politicas
    .filter((politica) => politica.ativa)
    .flatMap((politica) => {
      if (politica.escopo === "produto") {
        return politica.produtoId === contexto.produtoId
          ? [{ politica, prioridade: -1 }]
          : [];
      }
      const prioridade = distanciaCategoria(politica, contexto);
      return prioridade === null ? [] : [{ politica, prioridade }];
    })
    .sort((a, b) => a.prioridade - b.prioridade)
    .map(({ politica }) => politica);
}

export function resolverPoliticaRetiradaEntregaPropria({
  politicas,
  contexto,
}: {
  politicas: PoliticaEntregaPropriaResolucao[];
  contexto: Pick<
    ContextoResolucaoPoliticaEntregaPropria,
    "produtoId" | "categoriaId" | "ancestraisCategoriaIds"
  >;
}) {
  return (
    ordenarPoliticas(politicas, { ...contexto, destinos: {} }).find(
      (politica) =>
        politica.permiteRetirada !== null &&
        politica.permiteRetirada !== undefined,
    ) ?? null
  );
}

/**
 * Resolve somente precedência. A camada de query traduz CEP/bairro/região/cidade
 * para identificadores persistidos e o comportamento legado continua sendo o
 * fallback quando nenhuma combinação nova corresponde ao endereço.
 */
export function resolverPoliticaEntregaPropria({
  politicas,
  precos,
  contexto,
}: {
  politicas: PoliticaEntregaPropriaResolucao[];
  precos: PrecoPoliticaEntregaPropriaResolucao[];
  contexto: ContextoResolucaoPoliticaEntregaPropria;
}) {
  for (const politica of ordenarPoliticas(politicas, contexto)) {
    for (const tipoDestino of PRECEDENCIA_DESTINO) {
      const destino = contexto.destinos[tipoDestino];
      if (!destino) continue;
      const preco = precos.find(
        (item) =>
          item.ativa &&
          item.politicaId === politica.id &&
          item.tipoDestino === tipoDestino &&
          item.destinoIdOuUf === destino,
      );
      if (preco) return { politica, preco };
    }
  }
  return null;
}
