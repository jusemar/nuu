import type {
  ProvedorFrete,
  ResultadoCotacaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import {
  criarPortaEntregaPropriaAtual,
  type DependenciasPortaEntregaPropriaAtual,
} from "../portas/criar-porta-entrega-propria-atual";
import {
  criarPortaRetiradaAtual,
  type DependenciasPortaRetiradaAtual,
} from "../portas/criar-porta-retirada-atual";
import {
  criarProvedorFreteEntregaPropria,
  type ConfiguracaoProvedorFreteEntregaPropria,
} from "../provedores/criar-provedor-frete-entrega-propria";
import {
  criarProvedorFreteFrenet,
  type ConfiguracaoProvedorFreteFrenet,
  type DependenciasProvedorFreteFrenet,
} from "../provedores/criar-provedor-frete-frenet";
import {
  criarProvedorFreteRetirada,
  type ConfiguracaoProvedorFreteRetirada,
} from "../provedores/criar-provedor-frete-retirada";
import { orquestrarCotacaoFrete } from "./orquestrar-cotacao-frete";

export type DependenciasCotacaoFreteInterna = {
  entregaPropriaAtual?: DependenciasPortaEntregaPropriaAtual;
  retiradaAtual?: DependenciasPortaRetiradaAtual;
  frenet?: DependenciasProvedorFreteFrenet;
};

export type ConfiguracaoCotacaoFreteInterna = {
  entregaPropria?: ConfiguracaoProvedorFreteEntregaPropria;
  retirada?: ConfiguracaoProvedorFreteRetirada;
  frenet?: ConfiguracaoProvedorFreteFrenet | null;
};

function criarProvedoresFreteInterno(
  dependencias: DependenciasCotacaoFreteInterna,
  configuracao: ConfiguracaoCotacaoFreteInterna,
): ProvedorFrete[] {
  const provedores: ProvedorFrete[] = [];

  if (dependencias.entregaPropriaAtual) {
    const listarOpcoesEntregaPropria = criarPortaEntregaPropriaAtual(
      dependencias.entregaPropriaAtual,
    );

    provedores.push(
      criarProvedorFreteEntregaPropria(
        { listarOpcoesEntregaPropria },
        configuracao.entregaPropria,
      ),
    );
  }

  if (dependencias.retiradaAtual) {
    const listarOpcoesRetirada = criarPortaRetiradaAtual(
      dependencias.retiradaAtual,
    );

    provedores.push(
      criarProvedorFreteRetirada(
        { listarOpcoesRetirada },
        configuracao.retirada,
      ),
    );
  }

  if (configuracao.frenet) {
    provedores.push(
      criarProvedorFreteFrenet(configuracao.frenet, dependencias.frenet),
    );
  }

  return provedores;
}

export async function cotarFreteInterno(
  solicitacao: SolicitacaoCotacaoFrete,
  dependencias: DependenciasCotacaoFreteInterna,
  configuracao: ConfiguracaoCotacaoFreteInterna = {},
): Promise<ResultadoCotacaoFrete> {
  const provedores = criarProvedoresFreteInterno(dependencias, configuracao);

  return orquestrarCotacaoFrete(solicitacao, provedores);
}
