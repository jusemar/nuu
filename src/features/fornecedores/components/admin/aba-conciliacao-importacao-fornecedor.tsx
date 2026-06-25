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

  if (!temTexto(linha.precoFornecedor)) {
    pendencias.add("Preço principal ausente");
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

function montarRegrasObrigatorias(linha: LinhaConciliacaoImportacaoFornecedor) {
  const regras: ItemConciliacaoFornecedor["regrasObrigatorias"] = [];

  if (!temTexto(linha.categoriaFornecedor)) {
    regras.push({
      campo: "categoria_fornecedor",
      label: "Categoria da loja",
      estrategia: "conciliacao",
      observacao: "Não encontrada no arquivo. Será preenchida nesta etapa.",
      bloqueiaPublicacao: true,
    });
  } else {
    regras.push({
      campo: "categoria_fornecedor",
      label: "Categoria da loja",
      estrategia: "valor_padrao",
      valorAplicado: linha.categoriaFornecedor,
    });
  }

  if (!temTexto(linha.marcaFornecedor)) {
    regras.push({
      campo: "marca_fornecedor",
      label: "Marca da loja",
      estrategia: "conciliacao",
      observacao: "Não encontrada no arquivo. Será preenchida nesta etapa.",
      bloqueiaPublicacao: true,
    });
  } else {
    regras.push({
      campo: "marca_fornecedor",
      label: "Marca da loja",
      estrategia: "valor_padrao",
      valorAplicado: linha.marcaFornecedor,
    });
  }

  if (!temTexto(linha.precoFornecedor)) {
    regras.push({
      campo: "preco_fornecedor",
      label: "Preço principal",
      estrategia: "sem_solucao",
      observacao: "Preço não encontrado no arquivo.",
      bloqueiaPublicacao: true,
    });
  }

  return regras;
}

function montarRegrasImportantes(linha: LinhaConciliacaoImportacaoFornecedor) {
  const regras: ItemConciliacaoFornecedor["regrasImportantes"] = [];

  if (!linha.codigoFornecedor) {
    regras.push({
      campo: "codigo_fornecedor",
      label: "Código fornecedor",
      estrategia: "conciliacao",
      observacao: "Código ausente no arquivo.",
    });
  }

  return regras;
}

function montarItensConciliacaoArquivo(
  linhas: LinhaConciliacaoImportacaoFornecedor[],
): ItemConciliacaoFornecedor[] {
  return linhas.map((linha) => {
    const pendenciasObrigatorias = montarPendenciasObrigatorias(linha);
    const alertas = montarAlertas(linha);
    const regrasObrigatorias = montarRegrasObrigatorias(linha);
    const regrasImportantes = montarRegrasImportantes(linha);
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
      statusVinculacao: ignorado
        ? "ignorado"
        : linha.produtoLocalizadoId
          ? "vinculado"
          : "novo",
      status,
      pendenciasObrigatorias,
      alertas,
      regrasObrigatorias,
      regrasImportantes,
      configuracaoPreco: linha.precoFornecedor
        ? {
            modalidade: "Estoque próprio",
            valorAplicado: linha.precoFornecedor,
            prazo: "Conforme cadastro da loja",
            cardPrincipal: true,
            origem: "Preço recebido do arquivo",
          }
        : null,
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
