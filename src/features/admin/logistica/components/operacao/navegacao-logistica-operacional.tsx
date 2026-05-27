import React from "react";
import Link from "next/link";
import { Plug, Route, Settings2, Store, Truck, Warehouse } from "lucide-react";

const itensNavegacao = [
  { href: "/admin/logistica/visao-geral", nome: "Visão Geral", icone: Warehouse },
  { href: "/admin/logistica/integracoes", nome: "Integrações", icone: Plug },
  { href: "/admin/logistica/servicos-entrega", nome: "Serviços de Entrega", icone: Truck },
  {
    href: "/admin/logistica/regras-disponibilidade",
    nome: "Regras de Disponibilidade",
    icone: Settings2,
  },
  { href: "/admin/logistica/retirada-local", nome: "Retirada", icone: Store },
  { href: "/admin/logistics/entrega-propria", nome: "Entrega Própria", icone: Route },
];

export function NavegacaoLogisticaOperacional() {
  return (
    <nav aria-label="Módulos de logística" className="overflow-x-auto border-b pb-3">
      <div className="flex min-w-max gap-2">
        {itensNavegacao.map(({ href, nome, icone: Icone }) => (
          <Link
            key={href}
            href={href}
            className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Icone className="size-4" />
            {nome}
          </Link>
        ))}
      </div>
    </nav>
  );
}
