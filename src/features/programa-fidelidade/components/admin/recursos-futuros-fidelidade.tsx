import {
  Calendar,
  CalendarCheck,
  Gift,
  Medal,
  Rocket,
  Star,
  Tag,
  Users,
} from "lucide-react";

import { RECURSOS_FUTUROS } from "../../constants/dados-demonstracao";

const ICONES = {
  estrela: Star,
  usuarios: Users,
  presente: Gift,
  calendario: CalendarCheck,
  foguete: Rocket,
  medalha: Medal,
  etiqueta: Tag,
} as const;

export function RecursosFuturosFidelidade() {
  return (
    <section
      aria-labelledby="recursos-futuros"
      className="bg-card rounded-xl border p-5 shadow-sm sm:p-6"
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 id="recursos-futuros" className="font-semibold">
            Formas de ganhar pontos
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Recursos em desenvolvimento — serão ativados aqui quando
            disponíveis.
          </p>
        </div>
        <Calendar className="text-muted-foreground hidden size-5 sm:block" />
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {RECURSOS_FUTUROS.map((recurso) => {
          const Icone = ICONES[recurso.icone];
          return (
            <li
              key={recurso.titulo}
              className="bg-muted/30 flex items-start gap-3 rounded-xl border border-dashed p-4"
            >
              <span className="bg-card text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border">
                <Icone className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-sm font-medium">
                    {recurso.titulo}
                  </span>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                    Em breve
                  </span>
                </div>
                <p className="text-muted-foreground/80 mt-1 text-xs">
                  {recurso.descricao}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
