"use client";

import {
  type ItemConciliacaoFornecedor,
  TabelaConciliacaoFornecedor,
} from "./tabela-conciliacao-fornecedor";

type LinhaConciliacaoImportacaoFornecedor = {
  id: string;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
  precoFornecedor: string | null;
  estoqueFornecedor: number | null;
  produtoLocalizadoId: string | null;
  status: string;
  errosValidacao: Array<{ codigo: string; mensagem: string; campo?: string }>;
};

type AbaConciliacaoImportacaoFornecedorProps = {
  importacaoId: string;
  fornecedor: string;
  linhas: LinhaConciliacaoImportacaoFornecedor[];
};

function temTexto(valor: string | null | undefined) {
  return Boolean(valor && valor.trim().length > 0);
}

function montarPendenciasObrigatorias(
  linha: LinhaConciliacaoImportacaoFornecedor,
) {
  const pendencias = new Set<string>();

  if (!temTexto(linha.categoriaFornecedor)) {
    pendencias.add("Categoria obrigatória");
  }

  if (!temTexto(linha.marcaFornecedor)) {
    pendencias.add("Marca obrigatória");
  }

  linha.errosValidacao.forEach((erro) => {
    const campo = erro.campo?.toLowerCase() ?? "";
    if (campo.includes("categoria")) pendencias.add("Categoria obrigatória");
    if (campo.includes("marca")) pendencias.add("Marca obrigatória");
    if (campo.includes("nome")) pendencias.add("Nome obrigatório");
    if (campo.includes("preco") || campo.includes("preço")) {
      pendencias.add("Preço obrigatório");
    }
  });

  return Array.from(pendencias);
}

function montarAlertas(linha: LinhaConciliacaoImportacaoFornecedor) {
  const alertas = new Set<string>();

  linha.errosValidacao.forEach((erro) => {
    const campo = erro.campo?.toLowerCase() ?? "";

    if (
      !campo.includes("categoria") &&
      !campo.includes("marca") &&
      !campo.includes("nome") &&
      !campo.includes("preco") &&
      !campo.includes("preço")
    ) {
      alertas.add(erro.mensagem);
    }
  });

  if (!linha.codigoFornecedor) {
    alertas.add("Sem código do fornecedor");
  }

  return Array.from(alertas);
}

function montarItensConciliacaoArquivo(
  linhas: LinhaConciliacaoImportacaoFornecedor[],
): ItemConciliacaoFornecedor[] {
  return linhas.map((linha) => {
    const pendenciasObrigatorias = montarPendenciasObrigatorias(linha);
    const alertas = montarAlertas(linha);
    const ignorado = linha.status === "ignorado";
    const status = ignorado
      ? "ignorado"
      : pendenciasObrigatorias.length > 0
        ? "pendencia"
        : alertas.length > 0
          ? "alerta"
          : "pronto";

    return {
      id: linha.id,
      produto: {
        nome: linha.nomeProduto,
        codigo: linha.codigoFornecedor,
        preco: linha.precoFornecedor,
        estoque: linha.estoqueFornecedor,
        complemento: [
          linha.categoriaFornecedor ?? "sem categoria",
          linha.marcaFornecedor ?? "sem marca",
        ].join(" · "),
      },
      acaoPrevista: ignorado
        ? "ignorar"
        : linha.produtoLocalizadoId
          ? "atualizar"
          : "criar",
      status,
      pendenciasObrigatorias,
      alertas,
      motivoIgnorado: ignorado ? "Marcado como ignorado na vinculação" : null,
    };
  });
}

export function AbaConciliacaoImportacaoFornecedor({
  importacaoId,
  fornecedor,
  linhas,
}: AbaConciliacaoImportacaoFornecedorProps) {
  const itens = montarItensConciliacaoArquivo(linhas);

  return (
    <TabelaConciliacaoFornecedor
      tipoOrigem="arquivo"
      fornecedor={fornecedor}
      titulo="Conciliação da importação"
      subtitulo="Revise os itens antes da publicação e corrija pendências obrigatórias."
      hrefVoltar={`/admin/fornecedores/importacoes/${importacaoId}?etapa=vinculacao`}
      hrefProximaEtapa={`/admin/fornecedores/importacoes/${importacaoId}?etapa=preview`}
      itens={itens}
    />
  );
}
