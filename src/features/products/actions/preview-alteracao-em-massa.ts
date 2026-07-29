"use server";

import { validarAcessoAdmin } from "@/features/autenticacao/actions/validar-acesso-admin";

import { MODALIDADES_PRECO_PRODUTO } from "../constants/modalidades-preco";
import {
  type ConteudoAssinaturaPreview,
  criarAssinaturaPreview,
} from "../lib/alteracao-em-massa/assinatura-preview-alteracao-em-massa";
import {
  calcularPlanoAlteracaoEmMassa,
  type LinhaPreviewAlteracaoEmMassa,
} from "../lib/alteracao-em-massa/calcular-preview-alteracao-em-massa";
import { listarDadosAlteracaoEmMassa } from "../queries/alteracao-em-massa/listar-dados-alteracao-em-massa";
import { solicitarPreviewAlteracaoEmMassaSchema } from "../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type { PreviewServidorAlteracaoEmMassa } from "../types/resultado-alteracao-em-massa.types";

const ROTULOS_CAMPOS = {
  status: "Status",
  categoria: "Categoria",
  marca: "Marca",
  preco: "Preço",
  prazo: "Prazo",
  estoque: "Estoque",
  ncm: "NCM",
  peso: "Peso",
  altura: "Altura",
  largura: "Largura",
  comprimento: "Comprimento",
  entrega_rapida: "Entrega rápida",
  entrega_programada: "Entrega programada",
};

function resumir(
  produtosSelecionados: number,
  produtosSimples: number,
  linhas: LinhaPreviewAlteracaoEmMassa[],
  campos: string[],
  produtos: Awaited<
    ReturnType<typeof listarDadosAlteracaoEmMassa>
  >["dados"]["produtos"],
  incluiPreco: boolean,
) {
  const contar = (resultado: LinhaPreviewAlteracaoEmMassa["resultado"]) =>
    linhas.filter((linha) => linha.resultado === resultado).length;
  const ignoradosIds = new Set(
    linhas
      .filter((linha) => linha.resultado === "ignorado")
      .map((linha) => linha.produtoId),
  );
  return {
    produtosSelecionados,
    produtosSimples,
    produtosIgnorados: ignoradosIds.size,
    alteracoesEfetivas: contar("alterado"),
    semMudanca: contar("sem_alteracao"),
    conflitos: contar("conflito"),
    produtosAfetados: new Set(
      linhas
        .filter((linha) => linha.resultado === "alterado")
        .map((linha) => linha.produtoId),
    ).size,
    precosAlterados: linhas.filter(
      (linha) =>
        linha.resultado === "alterado" && linha.campo.startsWith("Preço ·"),
    ).length,
    modalidadesIgnoradasSemPreco: incluiPreco
      ? produtos
          .filter((produto) => produto.tipoProduto === "simple")
          .reduce((total, produto) => {
            const modalidadesValidas = new Set(
              produto.precosModalidades
                .filter(
                  (preco) =>
                    Number.isSafeInteger(preco.precoEmCentavos) &&
                    preco.precoEmCentavos >= 0,
                )
                .map((preco) => preco.modalidade),
            );
            return (
              total +
              Math.max(
                0,
                MODALIDADES_PRECO_PRODUTO.length - modalidadesValidas.size,
              )
            );
          }, 0)
      : 0,
    campos,
  };
}

export async function solicitarPreviewAlteracaoEmMassa(input: unknown) {
  const acesso = await validarAcessoAdmin();
  if (!acesso.sucesso) return { sucesso: false as const, erro: acesso.erro };

  const validacao = solicitarPreviewAlteracaoEmMassaSchema.safeParse(input);
  if (!validacao.success) {
    return { sucesso: false as const, erro: "Configuração inválida." };
  }

  const { produtosIds, operacoes } = validacao.data;
  const resultado = await listarDadosAlteracaoEmMassa(produtosIds);
  if (!resultado.sucesso)
    return {
      sucesso: false as const,
      erro: "Não foi possível carregar os produtos para o preview. Nenhuma alteração foi aplicada.",
      etapa: "carregamento_essencial_do_preview" as const,
    };

  const planos = calcularPlanoAlteracaoEmMassa(
    resultado.dados.produtos,
    operacoes,
    resultado.dados,
  );
  const linhas = planos.flatMap((plano) => plano.linhas);
  const encontrados = new Set(
    resultado.dados.produtos.map((produto) => produto.id),
  );
  produtosIds.forEach((produtoId, indice) => {
    if (!encontrados.has(produtoId)) {
      linhas.push({
        id: `${produtoId}-ausente-${indice}`,
        produtoId,
        produto: "Produto indisponível",
        sku: "—",
        campo: "Produto",
        atual: "Não encontrado",
        novo: "—",
        resultado: "conflito",
        motivo: "O produto não está mais disponível.",
      });
    }
  });

  const conteudo: ConteudoAssinaturaPreview = {
    produtosIds,
    operacoes,
    versoes: Object.fromEntries(
      planos.map((plano) => [plano.produto.id, plano.versao]),
    ),
    emitidoEm: Date.now(),
  };
  const preview: PreviewServidorAlteracaoEmMassa = {
    linhas,
    resumo: resumir(
      produtosIds.length,
      planos.filter((plano) => plano.produto.tipoProduto === "simple").length,
      linhas,
      [...new Set(operacoes.map((operacao) => ROTULOS_CAMPOS[operacao.campo]))],
      resultado.dados.produtos,
      operacoes.some((operacao) => operacao.campo === "preco"),
    ),
    assinaturaPreview: criarAssinaturaPreview(conteudo),
  };
  return { sucesso: true as const, preview };
}
