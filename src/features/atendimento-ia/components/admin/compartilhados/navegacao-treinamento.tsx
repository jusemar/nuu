"use client";

import {
  BarChart3,
  BrainCircuit,
  FlaskConical,
  House,
  MessagesSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  type IdRotaTreinamentoAdmin,
  ROTAS_TREINAMENTO_ADMIN,
} from "@/features/atendimento-ia/constants/admin/rotas-treinamento";
import { cn } from "@/lib/utils";

const ICONES_POR_ROTA = {
  conhecimentos: BrainCircuit,
  metricas: BarChart3,
  revisoes: MessagesSquare,
  testes: FlaskConical,
  visaoGeral: House,
} satisfies Record<IdRotaTreinamentoAdmin, typeof House>;

export function NavegacaoTreinamento() {
  const caminhoAtual = usePathname();

  return (
    <nav aria-label="Módulos de treinamento" className="overflow-x-auto pb-1">
      <div className="bg-card flex min-w-max gap-1 rounded-xl border p-1 shadow-sm">
        {ROTAS_TREINAMENTO_ADMIN.map(({ href, id, rotulo }) => {
          const Icone = ICONES_POR_ROTA[id];
          const ativo =
            id === "visaoGeral"
              ? caminhoAtual === href
              : caminhoAtual.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none",
                ativo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icone className="size-4" aria-hidden="true" />
              {rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
