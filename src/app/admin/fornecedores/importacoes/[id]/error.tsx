"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Rede de proteção da tela de detalhe da importação (Mapeamento, Vinculação e Revisão).
 *
 * Sem este arquivo, qualquer exceção lançada durante a renderização no servidor sobe até a
 * página de erro genérica do Next — que, em desenvolvimento, mostra a mensagem original do
 * erro. Era por aí que o SQL do driver aparecia na tela.
 *
 * Com a boundary, o usuário vê sempre a mesma tela: o que aconteceu, e dois caminhos de
 * saída. O `reset()` refaz a renderização do segmento sem recarregar a aplicação inteira,
 * o que resolve na hora quando a causa foi uma oscilação momentânea do banco.
 */
export default function ErroDetalheImportacaoFornecedor({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // O `digest` é o identificador que o Next grava no log do servidor junto do erro real.
    // É o que permite ligar a tela que o usuário viu à causa técnica, sem exibi-la aqui.
    console.error("[fornecedores] erro ao abrir a etapa da importação", {
      mensagem: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm dark:border-amber-900/50 dark:bg-zinc-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <AlertTriangle
            className="h-6 w-6 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Não foi possível abrir esta etapa
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {/* `error.message` só chega aqui já tratado pela camada de leitura segura.  */}
            {error.message ||
              "Tente novamente em alguns segundos. Nenhum dado da importação foi perdido."}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Os produtos já enviados continuam salvos nesta importação.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/fornecedores/importacoes">
              Voltar para Importações
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
