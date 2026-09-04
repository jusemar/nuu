import { validarLogisticaProdutoLaquila } from "@/features/fornecedores/integracoes/laquila/lib/validar-logistica-produto-laquila";

import {
  type ProblemaLogisticaProduto,
  validarLogisticaProduto,
} from "./validar-logistica-produto";

export type CodigoProblemaDiagnosticoLogistico =
  | ProblemaLogisticaProduto["codigo"]
  | "VINCULO_FORNECEDOR_AUSENTE"
  | "CODIGO_FORNECEDOR_AUSENTE"
  | "CONFIGURACAO_LOGISTICA_INVALIDA";

export type ProblemaDiagnosticoLogistico = {
  codigo: CodigoProblemaDiagnosticoLogistico;
  campo: string;
  mensagemAdmin: string;
};

export type VinculoLogisticoProduto = {
  fornecedorId: string;
  fornecedorNome: string;
  vinculoStatus: string;
  codigoFornecedor: string | null;
  provedor: string | null;
};

export type ProdutoParaDiagnosticoLogistico = {
  id: string;
  pesoEmGramas: number | null | undefined;
  alturaEmCm: number | null | undefined;
  larguraEmCm: number | null | undefined;
  comprimentoEmCm: number | null | undefined;
  tiposEntregaPermitidos: string[] | null | undefined;
  permiteRetirada: boolean | null | undefined;
};

export type OrigemDiagnosticoLogistico = {
  chave: string;
  rotulo: string;
  fornecedor: string | null;
  provedor: string | null;
};

export type DiagnosticoLogisticoProduto = {
  valido: boolean;
  problemas: ProblemaDiagnosticoLogistico[];
  origem: OrigemDiagnosticoLogistico;
};

function removerProblemasDuplicados(problemas: ProblemaDiagnosticoLogistico[]) {
  return problemas.filter(
    (problema, indice, lista) =>
      lista.findIndex((item) => item.codigo === problema.codigo) === indice,
  );
}

function resolverOrigemDiagnostico({
  produto,
  vinculos,
}: {
  produto: ProdutoParaDiagnosticoLogistico;
  vinculos: readonly VinculoLogisticoProduto[];
}): OrigemDiagnosticoLogistico {
  const vinculoLaquila = vinculos.find(
    (vinculo) => vinculo.provedor?.toLowerCase() === "laquila",
  );
  if (vinculoLaquila) {
    return {
      chave: "laquila",
      rotulo: "Laquila",
      fornecedor: vinculoLaquila.fornecedorNome,
      provedor: "laquila",
    };
  }

  const vinculoAtivo = vinculos.find(
    (vinculo) => vinculo.vinculoStatus === "ativo",
  );
  if (vinculoAtivo) {
    return {
      chave: vinculoAtivo.provedor
        ? `provedor:${vinculoAtivo.provedor}`
        : `fornecedor:${vinculoAtivo.fornecedorId}`,
      rotulo: vinculoAtivo.provedor
        ? `${vinculoAtivo.fornecedorNome} (${vinculoAtivo.provedor})`
        : vinculoAtivo.fornecedorNome,
      fornecedor: vinculoAtivo.fornecedorNome,
      provedor: vinculoAtivo.provedor,
    };
  }

  const tipos = produto.tiposEntregaPermitidos ?? [];
  if (tipos.includes("own")) {
    return {
      chave: "estoque-proprio",
      rotulo: "Estoque próprio",
      fornecedor: null,
      provedor: null,
    };
  }
  if (tipos.includes("carrier")) {
    return {
      chave: "transportadora",
      rotulo: "Transportadora",
      fornecedor: null,
      provedor: null,
    };
  }
  if (tipos.includes("supplier")) {
    return {
      chave: "fornecedor-nao-vinculado",
      rotulo: "Fornecedor não vinculado",
      fornecedor: null,
      provedor: null,
    };
  }
  if (produto.permiteRetirada) {
    return {
      chave: "retirada-local",
      rotulo: "Retirada local",
      fornecedor: null,
      provedor: null,
    };
  }

  return {
    chave: "nao-configurada",
    rotulo: "Origem não configurada",
    fornecedor: null,
    provedor: null,
  };
}

/**
 * Definição central de produto logisticamente válido.
 *
 * A regra comum é aplicada a todos os produtos; especializações são somadas
 * somente quando a origem persistida comprova que pertencem ao provedor.
 */
export function diagnosticarLogisticaProduto({
  produto,
  vinculos = [],
}: {
  produto: ProdutoParaDiagnosticoLogistico;
  vinculos?: readonly VinculoLogisticoProduto[];
}): DiagnosticoLogisticoProduto {
  const resultadoGeral = validarLogisticaProduto({
    pesoEmGramas: produto.pesoEmGramas,
    alturaEmCm: produto.alturaEmCm,
    larguraEmCm: produto.larguraEmCm,
    comprimentoEmCm: produto.comprimentoEmCm,
    tiposEntregaPermitidos: produto.tiposEntregaPermitidos,
    permiteSomenteRetirada:
      Boolean(produto.permiteRetirada) &&
      (produto.tiposEntregaPermitidos?.length ?? 0) === 0,
  });
  const vinculosLaquila = vinculos.filter(
    (vinculo) => vinculo.provedor?.toLowerCase() === "laquila",
  );

  let problemas: ProblemaDiagnosticoLogistico[] = resultadoGeral.problemas;
  if (vinculosLaquila.length > 0) {
    const vinculoAtivo = vinculosLaquila.find(
      (vinculo) => vinculo.vinculoStatus === "ativo",
    );
    const resultadoLaquila = validarLogisticaProdutoLaquila({
      pesoEmGramas: produto.pesoEmGramas,
      alturaEmCm: produto.alturaEmCm,
      larguraEmCm: produto.larguraEmCm,
      comprimentoEmCm: produto.comprimentoEmCm,
      possuiVinculoFornecedor: Boolean(vinculoAtivo),
      codigoFornecedor: vinculoAtivo?.codigoFornecedor,
      tiposEntregaPermitidos: produto.tiposEntregaPermitidos,
    });
    problemas = resultadoLaquila.problemas;
  }

  const problemasUnicos = removerProblemasDuplicados(problemas);
  return {
    valido: problemasUnicos.length === 0,
    problemas: problemasUnicos,
    origem: resolverOrigemDiagnostico({ produto, vinculos }),
  };
}
