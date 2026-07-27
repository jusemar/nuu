"use client";

import { MessageCircle } from "lucide-react";

interface AssistenteVirtualProdutoProps {
  nomeProduto: string;
}

/** Entrada honesta para a futura conversa contextualizada com o produto. */
export function AssistenteVirtualProduto({
  nomeProduto,
}: AssistenteVirtualProdutoProps) {
  return (
    <section
      aria-label="Assistente virtual do produto"
      className="border-surface-border rounded-xl border bg-white p-4"
    >
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-text-primary text-sm font-semibold">
            Precisa de ajuda com este produto?
          </h2>
          <p className="text-text-muted mt-1 text-sm">
            Converse com nosso assistente virtual sobre {nomeProduto}.
          </p>
          <button
            type="button"
            className="border-primary text-primary focus-visible:ring-primary mt-3 min-h-10 rounded-lg border px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onClick={() => {
              // A integração será conectada quando existir um canal real de atendimento.
            }}
          >
            Iniciar conversa
          </button>
        </div>
      </div>
    </section>
  );
}
