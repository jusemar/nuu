import { esquemaEnderecoEntrega } from "../../schemas/contratos-frete";
import type {
  ErroCotacaoFrete,
  EnderecoEntrega,
  ItemLogistico,
  PacoteEnvio,
  ResultadoCotacaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import {
  adaptarProdutoAtualParaLogistica,
  adaptarVarianteAtualParaLogistica,
  type ProdutoAtualComDimensoes,
  type VarianteAtualComDimensoes,
} from "../adaptadores/adaptar-produto-atual";
import {
  cotarFreteInterno,
  type ConfiguracaoCotacaoFreteInterna,
  type DependenciasCotacaoFreteInterna,
} from "../cotacoes/cotar-frete-interno";
import type { DependenciasPortaEntregaPropriaAtual } from "../portas/criar-porta-entrega-propria-atual";
import type { RetiradaAtualDisponivel } from "../portas/criar-porta-retirada-atual";
import { obterConfiguracaoFrenet } from "../provedores/frenet/obter-configuracao-frenet";
import { resolverItemLogistico } from "../resolver-item-logistico";

export type EntradaCotacaoFreteFluxoAtual = {
  produtoAtual: ProdutoAtualComDimensoes;
  varianteAtual?: VarianteAtualComDimensoes | null;
  quantidade: number;
  cep: string;
  identificadorCotacao?: string;
  valorDeclaradoEmCentavos?: number | null;
  retiradasAtuais?: RetiradaAtualDisponivel[];
  consultarEntregaPropriaAtual?: DependenciasPortaEntregaPropriaAtual["consultarEntregaPropriaAtual"];
};

export type ConfiguracaoEntradaCotacaoFreteFluxoAtual =
  ConfiguracaoCotacaoFreteInterna;

function limparCep(cep: string) {
  return cep.replace(/\D/g, "");
}

function criarIdentificadorCotacao(
  entrada: EntradaCotacaoFreteFluxoAtual,
  cepLimpo: string,
) {
  return (
    entrada.identificadorCotacao ||
    `cotacao-atual:${entrada.produtoAtual.identificadorProduto}:${cepLimpo || "sem-cep"}`
  );
}

function criarSolicitacaoVazia(
  entrada: EntradaCotacaoFreteFluxoAtual,
  cepLimpo: string,
): SolicitacaoCotacaoFrete {
  return {
    identificador: criarIdentificadorCotacao(entrada, cepLimpo),
    destino: {
      cep: cepLimpo,
      pais: "BR",
    },
    itens: [],
    pacotes: [],
    moeda: "BRL",
  };
}

function criarErroCotacao(codigo: string, mensagem: string): ErroCotacaoFrete {
  return {
    codigo,
    mensagem,
  };
}

function criarResultadoCotacaoComErro(
  solicitacao: SolicitacaoCotacaoFrete,
  erro: ErroCotacaoFrete,
): ResultadoCotacaoFrete {
  return {
    sucesso: false,
    solicitacao,
    opcoes: [],
    erros: [erro],
  };
}

function criarPacoteEnvioAtual(item: ItemLogistico): PacoteEnvio {
  return {
    identificador: `pacote-atual:${item.identificador}`,
    itens: [item],
    quantidadeVolumes: item.quantidade,
    pesoTotalEmGramas: item.pesoEmGramas * item.quantidade,
    dimensoes: item.dimensoes,
  };
}

function criarDependenciasCotacaoInterna(
  entrada: EntradaCotacaoFreteFluxoAtual,
): DependenciasCotacaoFreteInterna {
  const dependencias: DependenciasCotacaoFreteInterna = {};

  if (entrada.consultarEntregaPropriaAtual) {
    dependencias.entregaPropriaAtual = {
      consultarEntregaPropriaAtual: entrada.consultarEntregaPropriaAtual,
    };
  }

  if (entrada.retiradasAtuais) {
    dependencias.retiradaAtual = {
      async listarRetiradasAtuais() {
        return entrada.retiradasAtuais ?? [];
      },
    };
  }

  return dependencias;
}

function obterConfiguracaoCotacaoInterna(
  configuracao: ConfiguracaoEntradaCotacaoFreteFluxoAtual,
): ConfiguracaoCotacaoFreteInterna {
  if ("frenet" in configuracao) {
    return configuracao;
  }

  const configuracaoFrenet = obterConfiguracaoFrenet();

  return configuracaoFrenet
    ? {
        ...configuracao,
        frenet: configuracaoFrenet,
      }
    : configuracao;
}

export async function cotarFreteFluxoAtual(
  entrada: EntradaCotacaoFreteFluxoAtual,
  configuracao: ConfiguracaoEntradaCotacaoFreteFluxoAtual = {},
): Promise<ResultadoCotacaoFrete> {
  const cepLimpo = limparCep(entrada.cep);
  const produto = adaptarProdutoAtualParaLogistica(entrada.produtoAtual);
  const variante = entrada.varianteAtual
    ? adaptarVarianteAtualParaLogistica(entrada.varianteAtual)
    : null;
  const resolucaoItem = resolverItemLogistico({
    produto,
    variante,
    quantidade: entrada.quantidade,
    valorDeclaradoEmCentavos: entrada.valorDeclaradoEmCentavos,
  });

  if (resolucaoItem.sucesso === false) {
    return criarResultadoCotacaoComErro(
      criarSolicitacaoVazia(entrada, cepLimpo),
      criarErroCotacao(resolucaoItem.erro.codigo, resolucaoItem.erro.mensagem),
    );
  }

  const validacaoEndereco = esquemaEnderecoEntrega.safeParse({
    cep: cepLimpo,
    pais: "BR",
  });
  const pacote = criarPacoteEnvioAtual(resolucaoItem.item);
  const solicitacaoBase: SolicitacaoCotacaoFrete = {
    ...criarSolicitacaoVazia(entrada, cepLimpo),
    itens: [resolucaoItem.item],
    pacotes: [pacote],
  };

  if (!validacaoEndereco.success) {
    return criarResultadoCotacaoComErro(
      solicitacaoBase,
      criarErroCotacao(
        "cep-invalido",
        "Informe um CEP valido para cotar o frete.",
      ),
    );
  }

  const solicitacao: SolicitacaoCotacaoFrete = {
    ...solicitacaoBase,
    destino: validacaoEndereco.data as EnderecoEntrega,
  };

  return cotarFreteInterno(
    solicitacao,
    criarDependenciasCotacaoInterna(entrada),
    obterConfiguracaoCotacaoInterna(configuracao),
  );
}
