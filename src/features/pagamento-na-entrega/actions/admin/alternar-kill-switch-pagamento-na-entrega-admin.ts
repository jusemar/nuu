"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { configuracoesPagamentoTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

export type EstadoKillSwitchPagamentoNaEntrega = {
  sucesso: boolean;
  mensagem: string | null;
};

export const ESTADO_INICIAL_KILL_SWITCH: EstadoKillSwitchPagamentoNaEntrega = {
  sucesso: false,
  mensagem: null,
};

/**
 * Liga ou desliga o pagamento na entrega na loja inteira.
 *
 * É a chave-mestra da ativação gradual: todo o código pode estar publicado e inerte, e o
 * gestor decide o momento de expor a opção ao cliente — sem redeploy, e desligando na
 * mesma velocidade se algo der errado.
 *
 * Ligar aqui **não** habilita produto nenhum: continua sendo necessário configurar ao menos
 * um serviço de entrega própria e marcar cada produto. O opt-in de todas as camadas
 * permanece valendo — esta chave só remove o bloqueio global.
 *
 * Guarda de sessão na primeira linha, como nas demais ações administrativas: Server Action
 * é endpoint HTTP próprio, e o guard do layout protege a navegação, não a chamada direta.
 */
export async function alternarKillSwitchPagamentoNaEntregaAdmin(
  _estadoAtual: EstadoKillSwitchPagamentoNaEntrega,
  formData: FormData,
): Promise<EstadoKillSwitchPagamentoNaEntrega> {
  const sessao = await buscarSessaoAdmin();

  if (!sessao.autorizado) {
    return {
      sucesso: false,
      mensagem: "Sessão de administrador inválida ou expirada.",
    };
  }

  // Checkbox ausente no FormData significa desmarcado — o navegador simplesmente não o
  // envia. Por isso a leitura compara com "on" em vez de procurar "false".
  const ativar = formData.get("pagamentoNaEntregaAtivo") === "on";

  try {
    const atualizados = await dbTransacional
      .update(configuracoesPagamentoTable)
      .set({ pagamentoNaEntregaAtivo: ativar, updatedAt: new Date() })
      .where(eq(configuracoesPagamentoTable.ativo, true))
      .returning({ id: configuracoesPagamentoTable.id });

    if (atualizados.length === 0) {
      return {
        sucesso: false,
        mensagem: "Nenhuma configuração de pagamento ativa encontrada.",
      };
    }

    revalidatePath("/admin/logistica/pagamento-na-entrega");

    return {
      sucesso: true,
      mensagem: ativar
        ? "Pagamento na entrega ligado na loja."
        : "Pagamento na entrega desligado na loja.",
    };
  } catch (erro) {
    console.error(
      "[pagamento-na-entrega:alternar-kill-switch]",
      erro instanceof Error ? erro.message : erro,
    );

    return {
      sucesso: false,
      mensagem: "Não foi possível alterar a chave geral.",
    };
  }
}
