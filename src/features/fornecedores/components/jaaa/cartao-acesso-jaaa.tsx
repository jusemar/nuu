import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
/** Recebe um destino já resolvido. Não oferece edição ao representante nem recebe URLs do usuário. */
export function CartaoAcessoJaaa({
  destino,
  cliente = false,
}: {
  destino: string | null;
  cliente?: boolean;
}) {
  return (
    <section className="bg-card min-w-0 space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
        <h3 className="font-semibold">
          {cliente ? "Dúvidas sobre o produto?" : "Suas conversas"}
        </h3>
      </div>
      <p className="text-muted-foreground text-sm">
        {destino
          ? cliente
            ? "Converse pelo Jaaa com o atendimento deste produto."
            : "Acesse seu endereço público no Jaaa."
          : cliente
            ? "Nossa equipe pode ajudar você."
            : "Seu acesso ao Jaaa não está disponível. Solicite a configuração ao gestor."}
      </p>
      {destino ? (
        <Button asChild className="min-h-11 w-full">
          <a
            href={destino}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {cliente ? "Falar pelo Jaaa" : "Abrir Jaaa"}
          </a>
        </Button>
      ) : cliente ? (
        <Button asChild variant="outline" className="min-h-11 w-full">
          <Link href="/contato">Atendimento Nooo</Link>
        </Button>
      ) : null}
    </section>
  );
}
