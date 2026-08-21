import "server-only";

import { getProductOwnDeliveryPrice } from "@/features/admin/logistics/entrega-propria/services/shippingService";
import { verificarLogisticaLaquilaProduto } from "@/features/fornecedores/integracoes/laquila/queries/verificar-logistica-laquila-produto";
import {
  cotarFreteFluxoAtual,
  filtrarResultadoCotacaoFreteDisponivel,
  resolverOrigemExpedicaoProduto,
} from "@/features/logistica";
import { buscarDisponibilidadeFreteProduto } from "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-produto";
import { adaptarCotacaoLogisticaParaConsultaFrete } from "@/features/store/products/lib/frete/adaptar-cotacao-logistica-para-consulta-frete";
import { aplicarFreteGratisPromocionalConsultaFrete } from "@/features/store/products/lib/frete/aplicar-frete-gratis-promocional-consulta-frete";
import { buscarDadosCotacaoFreteLoja } from "@/features/store/products/queries/frete/buscar-dados-cotacao-frete-loja";

import type {
  EnderecoAmostraFreteMerchant,
  ProdutoPadraoMatrizFreteMerchant,
  ResultadoCotacaoMatrizFreteMerchant,
} from "../../types/matriz-frete-merchant";

function criarConsultaEntregaPropriaSomenteLeitura(
  produtoId: string,
  endereco: EnderecoAmostraFreteMerchant,
) {
  return async () => {
    const resultado = await getProductOwnDeliveryPrice(
      produtoId,
      endereco.cep,
      endereco.bairro,
      endereco.cidade,
      endereco.uf,
    );
    if (!resultado.found) {
      return { disponivel: false as const, motivo: resultado.message };
    }
    return {
      disponivel: true as const,
      valorEmCentavos: resultado.shippingPrice,
      descricao: resultado.deliveryDeadline ?? resultado.message,
      metadados: {
        nivelEntregaPropriaAtual: resultado.level,
        prazoEntregaPropriaAtual: resultado.deliveryDeadline ?? null,
        promessaEntregaPropria: resultado.promessaEntrega ?? null,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
        endereco: {
          cep: endereco.cep,
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
        },
      },
      opcoesAdicionais: resultado.entregaProgramada
        ? [
            {
              servico: "entrega-programada",
              nome: "Entrega programada",
              valorEmCentavos: resultado.entregaProgramada.valorEmCentavos,
              descricao: resultado.entregaProgramada.promessa.texto,
            },
          ]
        : [],
    };
  };
}

export async function cotarProdutoMatrizFreteMerchant({
  produto,
  endereco,
}: {
  produto: ProdutoPadraoMatrizFreteMerchant;
  endereco: EnderecoAmostraFreteMerchant;
}): Promise<ResultadoCotacaoMatrizFreteMerchant> {
  try {
    const [dados, laquila] = await Promise.all([
      buscarDadosCotacaoFreteLoja(produto.produtoId, produto.varianteId),
      verificarLogisticaLaquilaProduto(produto.produtoId),
    ]);
    if (!dados) {
      return {
        entregavel: false,
        menorCustoEmCentavos: null,
        maiorPrazoEmDiasUteis: null,
        causa: "Dados logísticos do produto não encontrados.",
      };
    }

    const resultado = await cotarFreteFluxoAtual({
      ...dados,
      retiradasAtuais: [],
      quantidade: 1,
      cep: endereco.cep,
      contextoOrigemExpedicao: resolverOrigemExpedicaoProduto({
        fornecedorProvedorAtivo: laquila ? "laquila" : null,
      }),
      consultarEntregaPropriaAtual: criarConsultaEntregaPropriaSomenteLeitura(
        produto.produtoId,
        endereco,
      ),
    });
    const disponibilidade = await buscarDisponibilidadeFreteProduto({
      produtoId: produto.produtoId,
      varianteId: dados.varianteAtual?.identificadorVariante ?? null,
      categoriaId: dados.categoriaId,
    });
    const resultadoFiltrado = filtrarResultadoCotacaoFreteDisponivel(
      resultado,
      disponibilidade,
    );
    const consulta =
      adaptarCotacaoLogisticaParaConsultaFrete(resultadoFiltrado);
    const consultaFinal = await aplicarFreteGratisPromocionalConsultaFrete({
      resultado: consulta,
      categoriaId: dados.categoriaId,
      subtotalEmCentavos: Math.max(dados.valorDeclaradoEmCentavos ?? 0, 0),
      cep: endereco.cep,
      modalidadeComercial: produto.modalidadeComercial,
    });
    const opcoes = consultaFinal.opcoesEntrega ?? [];
    if (opcoes.length === 0) {
      return {
        entregavel: false,
        menorCustoEmCentavos: null,
        maiorPrazoEmDiasUteis: null,
        causa: consultaFinal.message || "Nenhuma opção de entrega válida.",
      };
    }

    const prazos = resultadoFiltrado.opcoes
      .filter((opcao) => opcao.tipo === "entrega")
      .map(
        (opcao) =>
          opcao.prazoMaximoEmDiasUteis ?? opcao.prazoMinimoEmDiasUteis ?? null,
      )
      .filter((prazo): prazo is number => prazo !== null);
    return {
      entregavel: true,
      menorCustoEmCentavos: Math.min(
        ...opcoes.map((opcao) => opcao.valorEmCentavos),
      ),
      maiorPrazoEmDiasUteis: prazos.length > 0 ? Math.max(...prazos) : null,
    };
  } catch (erro) {
    return {
      entregavel: false,
      menorCustoEmCentavos: null,
      maiorPrazoEmDiasUteis: null,
      causa:
        erro instanceof Error ? erro.message : "Falha inesperada na cotação.",
    };
  }
}
