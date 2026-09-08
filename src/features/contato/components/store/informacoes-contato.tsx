import { ArrowRight, PackageSearch } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AcompanhamentoPedido() {
  return (
    <section className="border-primary/15 bg-primary-light flex flex-col gap-5 rounded-2xl border p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-xl">
          <PackageSearch className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold">
            Já tem um pedido? Acompanhe aqui.
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Você também pode verificar o status do seu pedido diretamente na sua
            conta.
          </p>
        </div>
      </div>
      <Button asChild size="lg" className="shrink-0">
        <Link href="/minha-conta/pedidos">
          Acessar meus pedidos
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
