"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  configuracoesPagamentoNaEntregaServicoTable,
  provedoresFreteTable,
  servicosFreteTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

import { PROVEDOR_ENTREGA_PROPRIA } from "../../constants/pagamento-na-entrega.constants";
import {
  extrairDadosFormularioConfiguracao,
  salvarConfiguracaoPagamentoNaEntregaServicoSchema,
} from "../../schemas/configuracao-pagamento-na-entrega-servico.schema";
import type { EstadoSalvarConfiguracaoPagamentoNaEntrega } from "../../types/pagamento-na-entrega.types";

/**
 * Salva a configuração de pagamento na entrega de um serviço de frete.
 *
 * Server Action é um endpoint HTTP como qualquer outro: o guard do layout do admin protege
 * a navegação, não a chamada direta. Por isso a sessão é verificada aqui dentro, na
 * primeira linha, independentemente de qualquer middleware.
 */
export async function salvarConfiguracaoPagamentoNaEntregaServico(
  _estadoAtual: EstadoSalvarConfiguracaoPagamentoNaEntrega,
  formData: FormData,
): Promise<EstadoSalvarConfiguracaoPagamentoNaEntrega> {
  const sessao = await buscarSessaoAdmin();

  if (!sessao.autorizado) {
    return {
      sucesso: false,
      mensagem: "Sessão de administrador inválida ou expirada.",
      servicoFreteId: null,
    };
  }

  const validacao = salvarConfiguracaoPagamentoNaEntregaServicoSchema.safeParse(
    extrairDadosFormularioConfiguracao(formData),
  );

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
      servicoFreteId: null,
    };
  }

  const dados = validacao.data;

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      // O id do serviço veio do formulário, então não é confiável. Confere no banco que
      // ele existe E que pertence à entrega própria — sem isso alguém poderia forjar a
      // requisição e habilitar pagamento na entrega para um serviço dos Correios.
      const [servico] = await tx
        .select({
          id: servicosFreteTable.id,
          provedorIdentificador: provedoresFreteTable.identificador,
        })
        .from(servicosFreteTable)
        .innerJoin(
          provedoresFreteTable,
          eq(servicosFreteTable.provedorFreteId, provedoresFreteTable.id),
        )
        .where(eq(servicosFreteTable.id, dados.servicoFreteId))
        .limit(1);

      if (!servico) {
        return { salvo: false, mensagem: "Serviço de entrega não encontrado." };
      }

      if (servico.provedorIdentificador !== PROVEDOR_ENTREGA_PROPRIA) {
        return {
          salvo: false,
          mensagem:
            "Pagamento na entrega só pode ser configurado para serviços de entrega própria.",
        };
      }

      const valores = {
        servicoFreteId: dados.servicoFreteId,
        aceitaPagamentoNaEntrega: dados.aceitaPagamentoNaEntrega,
        aceitaDinheiro: dados.aceitaDinheiro,
        aceitaPixNaEntrega: dados.aceitaPixNaEntrega,
        aceitaDebito: dados.aceitaDebito,
        aceitaCredito: dados.aceitaCredito,
        valorMinimoPedidoEmCentavos: dados.valorMinimoPedidoEmCentavos,
        valorMaximoPedidoEmCentavos: dados.valorMaximoPedidoEmCentavos,
        valorMaximoDinheiroEmCentavos: dados.valorMaximoDinheiroEmCentavos,
        exigeTroco: dados.exigeTroco,
        observacoesCliente: dados.observacoesCliente,
        ativo: dados.ativo,
        updatedAt: new Date(),
      };

      // Idempotência estrutural: o índice único em `servico_frete_id` transforma um
      // segundo envio (duplo clique, retry de rede) em atualização da mesma linha, nunca
      // em duplicata. É o mesmo padrão de `onConflict` usado nos webhooks do projeto.
      await tx
        .insert(configuracoesPagamentoNaEntregaServicoTable)
        .values(valores)
        .onConflictDoUpdate({
          target: configuracoesPagamentoNaEntregaServicoTable.servicoFreteId,
          set: valores,
        });

      return { salvo: true, mensagem: "Configuração salva." };
    });

    if (resultado.salvo) {
      revalidatePath("/admin/logistica/pagamento-na-entrega");
    }

    return {
      sucesso: resultado.salvo,
      mensagem: resultado.mensagem,
      servicoFreteId: dados.servicoFreteId,
    };
  } catch (erro) {
    console.error(
      "[pagamento-na-entrega:salvar-configuracao-servico]",
      erro instanceof Error ? erro.message : erro,
    );

    return {
      sucesso: false,
      mensagem: "Não foi possível salvar a configuração.",
      servicoFreteId: dados.servicoFreteId,
    };
  }
}
