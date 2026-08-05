import { Banknote, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <div className="grid gap-6 xl:grid-cols-2">
          {painel.linhas.map((linha) => (
            <Card key={linha.servicoFreteId} className="flex flex-col">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {linha.servicoNome}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {linha.servicoIdentificador}
                    </CardDescription>
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
              </CardHeader>
              <CardContent className="flex-1">
                <FormularioConfiguracaoPagamentoNaEntregaServico linha={linha} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
