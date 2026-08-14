import { LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RECURSOS_FUTUROS } from "../../constants/dados-demonstracao";

export function RecursosFuturosFidelidade() {
  return (
    <section aria-labelledby="recursos-futuros">
      <Card>
        <CardHeader>
          <CardTitle id="recursos-futuros">
            Outras formas de ganhar pontos
          </CardTitle>
          <CardDescription>
            Visão das próximas possibilidades do programa. Nenhum destes
            recursos está ativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {RECURSOS_FUTUROS.map((recurso) => (
            <article
              key={recurso}
              className="bg-muted/40 flex min-h-24 flex-col justify-between gap-3 rounded-lg border p-4 opacity-70"
            >
              <div className="flex items-center gap-2">
                <LockKeyhole className="text-muted-foreground size-4" />
                <h3 className="text-sm font-semibold">{recurso}</h3>
              </div>
              <Badge variant="outline">Disponível futuramente</Badge>
            </article>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
