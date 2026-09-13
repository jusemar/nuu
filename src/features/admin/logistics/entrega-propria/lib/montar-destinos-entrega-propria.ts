import {
  type AgendaGeograficaParaCalculo,
  resolverAgendaGeograficaEntregaPropria,
} from "@/features/logistica/lib/entrega-propria/calcular-oferta-entrega-propria";
import { identificarGeografiaEntregaPropria } from "@/features/logistica/lib/entrega-propria/identificar-geografia-entrega-propria";
import { normalizarLocalidadeEntregaPropria } from "@/features/logistica/lib/entrega-propria/normalizar-localidade-entrega-propria";
import type { NivelGeograficoEntregaPropria } from "@/features/logistica/lib/entrega-propria/resolver-hierarquia-entrega-propria";

const CAMINHO_AGENDA = "/admin/logistics/entrega-propria/agenda";

const NOMES_NIVEL: Record<NivelGeograficoEntregaPropria, string> = {
  cidade: "Cidade",
  regiao: "Região",
  bairro: "Bairro",
  cep: "CEP",
};

/** Destino selecionável no Produto, com a agenda efetiva já resolvida. */
export type EntregaPropriaDestinoProduto = {
  type: "region" | "bairro" | "cep-especifico" | "cidade";
  id: number;
  label: string;
  city: string;
  state: string;
  configuracaoLogisticaHref: string | null;
  agendaEntrega: {
    nivel: NivelGeograficoEntregaPropria;
    diasDaSemana: number[];
    horarioCorte: string;
    origem: string;
    configuracaoHref: string;
  } | null;
};

// Formas mínimas das linhas do banco usadas na montagem (facilita testes).
type CidadeEntrada = { id: number; name: string; stateUf: string };
type RegiaoEntrada = {
  id: number;
  name: string;
  city: string;
  state: string;
  cityId: number;
  isActive: boolean;
};
type RegiaoComFaixas = RegiaoEntrada & {
  cepRanges: { cepStart: string; cepEnd: string; isActive: boolean }[];
};
type BairroEntrada = {
  id: number;
  nome: string;
  cidadeId: number;
  cidade: CidadeEntrada;
  regiao: RegiaoEntrada | null;
};
type CepEntrada = {
  id: number;
  cep: string;
  neighborhood: string;
  city: string;
  state: string;
  /**
   * Bairro do endereço cadastrado do CEP (base local de CEPs). É o bairro que
   * a cotação pública recebe; quando existir, tem prioridade sobre o texto
   * digitado no cadastro do CEP específico.
   */
  bairroEnderecoCadastrado?: string | null;
};

function formatarCep(cep: string) {
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

/**
 * Monta os destinos Cidade/Região/Bairro/CEP do Admin com a agenda efetiva.
 *
 * Usa exatamente as mesmas funções puras do motor público
 * (`identificarGeografiaEntregaPropria` + `resolverAgendaGeograficaEntregaPropria`),
 * garantindo que Admin e loja nunca resolvam agendas diferentes.
 */
export function montarDestinosEntregaPropria({
  cidades,
  regioes,
  bairros,
  ceps,
  agendas,
}: {
  cidades: readonly CidadeEntrada[];
  regioes: readonly RegiaoComFaixas[];
  bairros: readonly BairroEntrada[];
  ceps: readonly CepEntrada[];
  agendas: readonly Omit<AgendaGeograficaParaCalculo, "datasBloqueadas">[];
}): EntregaPropriaDestinoProduto[] {
  const obterAgenda = ({
    cidade,
    regiaoFaixaCep,
    regiaoBairro,
    bairro,
    cep,
  }: {
    cidade: { id: number; name: string };
    regiaoFaixaCep?: RegiaoEntrada | null;
    regiaoBairro?: RegiaoEntrada | null;
    bairro?: { id: number; nome: string } | null;
    cep?: CepEntrada | null;
  }): EntregaPropriaDestinoProduto["agendaEntrega"] => {
    const { ids, regiao } = identificarGeografiaEntregaPropria({
      cidadeId: cidade.id,
      regiaoFaixaCep,
      regiaoBairro,
      bairroId: bairro?.id,
      cepEspecificoId: cep?.id,
    });
    const resolvida = resolverAgendaGeograficaEntregaPropria(agendas, ids);
    if (!resolvida) return null;

    const rotulos: Partial<Record<NivelGeograficoEntregaPropria, string>> = {
      cidade: cidade.name,
      regiao: regiao?.name,
      bairro: bairro?.nome,
      cep: cep ? formatarCep(cep.cep) : undefined,
    };
    const rotulo = rotulos[resolvida.nivel];
    // O link já abre a Agenda Geográfica filtrada no destino de origem.
    const parametros = new URLSearchParams({ nivel: resolvida.nivel });
    if (rotulo) parametros.set("busca", rotulo);

    return {
      nivel: resolvida.nivel,
      diasDaSemana: resolvida.registro.diasAtendidos,
      horarioCorte: resolvida.registro.horarioCorte,
      origem: `${NOMES_NIVEL[resolvida.nivel]}: ${rotulo ?? "configurada"}`,
      configuracaoHref: `${CAMINHO_AGENDA}?${parametros.toString()}`,
    };
  };

  return [
    ...cidades.map((cidade) => ({
      type: "cidade" as const,
      id: cidade.id,
      label: cidade.name,
      city: cidade.name,
      state: cidade.stateUf,
      configuracaoLogisticaHref: CAMINHO_AGENDA,
      agendaEntrega: obterAgenda({ cidade }),
    })),
    ...regioes.map((regiao) => ({
      type: "region" as const,
      id: regiao.id,
      label: regiao.name,
      city: regiao.city,
      state: regiao.state,
      configuracaoLogisticaHref: CAMINHO_AGENDA,
      agendaEntrega: obterAgenda({
        cidade: { id: regiao.cityId, name: regiao.city },
        regiaoFaixaCep: regiao,
      }),
    })),
    ...bairros.map((bairro) => ({
      type: "bairro" as const,
      id: bairro.id,
      label: bairro.nome,
      city: bairro.cidade.name,
      state: bairro.cidade.stateUf,
      configuracaoLogisticaHref: CAMINHO_AGENDA,
      agendaEntrega: obterAgenda({
        cidade: bairro.cidade,
        regiaoBairro: bairro.regiao,
        bairro,
      }),
    })),
    ...ceps.map((cep) => {
      // Um CEP específico herda bairro, região (faixa de CEP) e cidade.
      const cidade = cidades.find(
        (item) =>
          item.stateUf === cep.state &&
          normalizarLocalidadeEntregaPropria(item.name) ===
            normalizarLocalidadeEntregaPropria(cep.city),
      );
      const nomeBairro = cep.bairroEnderecoCadastrado || cep.neighborhood;
      const bairro = cidade
        ? bairros.find(
            (item) =>
              item.cidadeId === cidade.id &&
              normalizarLocalidadeEntregaPropria(item.nome) ===
                normalizarLocalidadeEntregaPropria(nomeBairro),
          )
        : null;
      const regiaoFaixaCep = regioes.find((item) =>
        item.cepRanges.some(
          (faixa) =>
            faixa.isActive &&
            faixa.cepStart <= cep.cep &&
            faixa.cepEnd >= cep.cep,
        ),
      );
      const agendaEntrega = cidade
        ? obterAgenda({
            cidade,
            regiaoFaixaCep,
            regiaoBairro: bairro?.regiao,
            bairro,
            cep,
          })
        : null;
      return {
        type: "cep-especifico" as const,
        id: cep.id,
        label: `${formatarCep(cep.cep)} - ${cep.neighborhood}`,
        city: cep.city,
        state: cep.state,
        configuracaoLogisticaHref:
          agendaEntrega?.configuracaoHref ?? CAMINHO_AGENDA,
        agendaEntrega,
      };
    }),
  ];
}
