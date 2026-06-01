import type { ResultadoCotacaoFrete } from "@/features/logistica";

import type {
  ConsultaFreteResult,
  ConsultaFreteSucesso,
  EnderecoFreteConsultado,
} from "../../types/consulta-frete.types";

type MetadadosEntregaPropriaAtual = {
  nivelEntregaPropriaAtual?: ConsultaFreteSucesso["level"];
  prazoEntregaPropriaAtual?: string | null;
  bairro?: string;
  cidade?: string;
  uf?: string;
  endereco?: EnderecoFreteConsultado;
};

function obterMetadadosEntregaPropriaAtual(
  metadados: Record<string, unknown> | null | undefined,
) {
  return (metadados ?? {}) as MetadadosEntregaPropriaAtual;
}

function obterOpcaoEntregaPropria(resultado: ResultadoCotacaoFrete) {
  return resultado.opcoes.find(
    (opcao) => opcao.tipo === "entrega" && opcao.provedor === "entrega-propria",
  );
}

function obterPrazoOpcaoEntrega(
  opcao: ResultadoCotacaoFrete["opcoes"][number],
) {
  if (opcao.descricao) {
    return opcao.descricao;
  }

  if (
    opcao.prazoMinimoEmDiasUteis !== null &&
    opcao.prazoMinimoEmDiasUteis !== undefined
  ) {
    return `${opcao.prazoMinimoEmDiasUteis} dias uteis`;
  }

  return null;
}

function obterOpcoesEntrega(resultado: ResultadoCotacaoFrete) {
  return resultado.opcoes
    .filter((opcao) => opcao.tipo === "entrega")
    .map((opcao) => ({
      identificador: opcao.identificador,
      provedor: opcao.provedor,
      servico: opcao.servico,
      nome: opcao.nome,
      prazo: obterPrazoOpcaoEntrega(opcao),
      valorEmCentavos: opcao.valorEmCentavos,
    }));
}

export function adaptarCotacaoLogisticaParaConsultaFrete(
  resultado: ResultadoCotacaoFrete,
): ConsultaFreteResult {
  const opcao = obterOpcaoEntregaPropria(resultado);
  const opcoesEntrega = obterOpcoesEntrega(resultado);

  if (!opcao) {
    return {
      found: false,
      message:
        resultado.sucesso === false
          ? (resultado.erros[0]?.mensagem ?? "Consulte o vendedor")
          : "Consulte o vendedor",
      opcoesEntrega,
    };
  }

  const metadados = obterMetadadosEntregaPropriaAtual(opcao.metadados);

  return {
    found: true,
    shippingPrice: opcao.valorEmCentavos,
    deliveryDeadline: metadados.prazoEntregaPropriaAtual ?? null,
    level: metadados.nivelEntregaPropriaAtual ?? "regiao",
    message: opcao.descricao || opcao.nome,
    bairro: metadados.bairro ?? "",
    cidade: metadados.cidade ?? "",
    uf: metadados.uf ?? "",
    endereco: metadados.endereco ?? {
      cep: resultado.solicitacao.destino.cep,
      logradouro: "",
      bairro: metadados.bairro ?? "",
      cidade: metadados.cidade ?? "",
      uf: metadados.uf ?? "",
    },
    opcoesEntrega,
  };
}
