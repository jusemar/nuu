import { Banknote, TriangleAlert } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import type { PainelPagamentoNaEntregaAdmin } from "../../queries/admin/listar-configuracoes-pagamento-na-entrega-servico";
import { ChaveGeralPagamentoNaEntrega } from "./chave-geral-pagamento-na-entrega";
import { FormularioConfiguracaoPagamentoNaEntregaServico } from "./formulario-configuracao-pagamento-na-entrega-servico";

/** Resume, em uma frase, o que está valendo hoje para o serviço. */
function resumirConfiguracao(
  linha: PainelPagamentoNaEntregaAdmin["linhas"][number],
) {
  const { configuracao } = linha;

  if (configuracao === null) return "Ainda não configurado";
  if (!configuracao.ativo) return "Configuração desativada";
  if (!configuracao.aceitaPagamentoNaEntrega) return "Não aceita";

  const quantidadeFormas = [
    configuracao.aceitaDinheiro,
    configuracao.aceitaPixNaEntrega,
    configuracao.aceitaDebito,
    configuracao.aceitaCredito,
  ].filter(Boolean).length;

  return `${quantidadeFormas} forma${quantidadeFormas === 1 ? "" : "s"} habilitada${quantidadeFormas === 1 ? "" : "s"}`;
}

export function PaginaPagamentoNaEntregaAdmin({
  painel,
}: {
  painel: PainelPagamentoNaEntregaAdmin;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          <Banknote className="size-6" />
          Pagamento na Entrega
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Defina, por serviço de entrega própria, quais formas de pagamento o
          cliente pode usar no momento em que recebe o pedido.
        </p>
      </header>

      {/* Chave geral: contexto obrigatório antes de qualquer configuração abaixo, e o
          mecanismo de ativação gradual da funcionalidade. */}
      <ChaveGeralPagamentoNaEntrega
        ativo={painel.pagamentoNaEntregaAtivoGlobalmente}
      />

      {painel.linhas.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Nenhum serviço de entrega própria encontrado. Rode o seed de dados
            iniciais de logística para criar a entrega rápida e a programada.
          </p>
        </div>
      ) : (
        /*
          Accordion em vez de cards abertos lado a lado: com os dois formulários expandidos
          a página ficava longa demais para operar. `type="single"` garante no máximo um
          aberto; `collapsible` permite fechar o que está aberto e voltar ao estado inicial,
          com tudo recolhido. Sem `defaultValue`, a página abre com os dois fechados.

          O cabeçalho fechado precisa bastar para identificar o serviço sem expandir — por
          isso mantém nome, identificador e o mesmo resumo de status que os cards traziam.
          A seta de expansão já vem do `AccordionTrigger` do Design System.
        */
        <Accordion
          type="single"
          collapsible
          className="divide-y rounded-lg border dark:border-zinc-800"
        >
          {painel.linhas.map((linha) => (
            <AccordionItem
              key={linha.servicoFreteId}
              value={linha.servicoFreteId}
              className="border-b-0 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pr-2">
                  <div className="flex min-w-0 flex-col gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {linha.servicoNome}
                    </span>
                    <span className="truncate font-mono text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {linha.servicoIdentificador}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {!linha.servicoAtivo && (
                      <Badge variant="outline">Serviço inativo</Badge>
                    )}
                    <Badge variant="secondary">
                      {resumirConfiguracao(linha)}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FormularioConfiguracaoPagamentoNaEntregaServico linha={linha} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
