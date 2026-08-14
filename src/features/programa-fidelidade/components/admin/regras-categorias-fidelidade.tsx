import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type {
  CategoriaFidelidade,
  ConfiguracaoFidelidadeMock,
  RegraCategoriaFidelidade,
} from "../../types/programa-fidelidade.types";
import { CampoRegraPontos } from "./campo-regra-pontos";

type Props = {
  categorias: CategoriaFidelidade[];
  configuracao: ConfiguracaoFidelidadeMock;
  regras: RegraCategoriaFidelidade[];
  atualizarRegra: (
    categoriaId: string,
    alteracao: Partial<RegraCategoriaFidelidade>,
  ) => void;
};

export function RegrasCategoriasFidelidade({
  categorias,
  configuracao,
  regras,
  atualizarRegra,
}: Props) {
  return (
    <section aria-labelledby="pontos-categoria">
      <Card>
        <CardHeader>
          <CardTitle id="pontos-categoria">Pontos por categoria</CardTitle>
          <CardDescription>
            A regra global é herdada automaticamente. Personalize somente as
            exceções.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-4 text-center sm:flex-row sm:gap-3">
            <Badge>Regra global</Badge>
            <span aria-hidden="true">→</span>
            <span className="text-sm font-medium">
              Todas as categorias herdam
            </span>
            <span aria-hidden="true">→</span>
            <span className="text-muted-foreground text-sm">
              Personalize apenas exceções
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {categorias.map((categoria) => {
              const regra = regras.find(
                (item) => item.categoriaId === categoria.id,
              );
              if (!regra) return null;
              const valor = regra.personalizada
                ? regra.valorGasto
                : configuracao.valorGastoPadrao;
              const pontos = regra.personalizada
                ? regra.pontos
                : configuracao.pontosPadrao;
              return (
                <article
                  key={categoria.id}
                  className="space-y-4 rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{categoria.nome}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        R$ {valor || "0"} = {pontos || "0"} ponto(s)
                      </p>
                    </div>
                    <Badge
                      variant={regra.personalizada ? "secondary" : "outline"}
                    >
                      {regra.personalizada ? "Personalizada" : "Regra padrão"}
                    </Badge>
                  </div>
                  <RadioGroup
                    value={regra.personalizada ? "personalizada" : "padrao"}
                    onValueChange={(v) =>
                      atualizarRegra(categoria.id, {
                        personalizada: v === "personalizada",
                      })
                    }
                    className="sm:grid-cols-2"
                  >
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
                      <RadioGroupItem value="padrao" />
                      <span className="text-sm">Usar regra padrão</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
                      <RadioGroupItem value="personalizada" />
                      <span className="text-sm">Usar regra personalizada</span>
                    </label>
                  </RadioGroup>
                  {regra.personalizada && (
                    <CampoRegraPontos
                      id={`categoria-${categoria.id}`}
                      valorGasto={regra.valorGasto}
                      pontos={regra.pontos}
                      onValorGastoChange={(v) =>
                        atualizarRegra(categoria.id, { valorGasto: v })
                      }
                      onPontosChange={(v) =>
                        atualizarRegra(categoria.id, { pontos: v })
                      }
                    />
                  )}
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
