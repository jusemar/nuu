import { AlertTriangle, CheckCircle2, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DiagnosticoLogisticoProduto } from "@/features/logistica/lib/diagnosticar-logistica-produto";

type AlertaDiagnosticoLogisticoProdutoProps = {
  diagnostico: DiagnosticoLogisticoProduto | null | undefined;
  aoAbrirConfiguracaoTransporte?: () => void;
};

const campos = [
  { rotulo: "Peso", codigos: ["PESO_AUSENTE", "PESO_INVALIDO"] },
  { rotulo: "Altura", codigos: ["ALTURA_AUSENTE", "ALTURA_INVALIDA"] },
  { rotulo: "Largura", codigos: ["LARGURA_AUSENTE", "LARGURA_INVALIDA"] },
  {
    rotulo: "Comprimento",
    codigos: ["COMPRIMENTO_AUSENTE", "COMPRIMENTO_INVALIDO"],
  },
  {
    rotulo: "Origem",
    codigos: [
      "ORIGEM_ENVIO_AUSENTE",
      "VINCULO_FORNECEDOR_AUSENTE",
      "CODIGO_FORNECEDOR_AUSENTE",
    ],
  },
  {
    rotulo: "Transporte",
    codigos: [
      "CONFIGURACAO_TRANSPORTE_INVALIDA",
      "CONFIGURACAO_LOGISTICA_INVALIDA",
    ],
  },
] as const;

/** Traduz o diagnóstico técnico para ações legíveis pelo gestor. */
export function AlertaDiagnosticoLogisticoProduto({
  diagnostico,
  aoAbrirConfiguracaoTransporte,
}: AlertaDiagnosticoLogisticoProdutoProps) {
  if (!diagnostico || diagnostico.valido) return null;
  const problemaTransporte = diagnostico.problemas.some((problema) =>
    [
      "CONFIGURACAO_TRANSPORTE_INVALIDA",
      "CONFIGURACAO_LOGISTICA_INVALIDA",
    ].includes(problema.codigo),
  );

  return (
    <section
      className="border-warning/40 bg-warning-light/55 mx-3 mt-4 rounded-xl border p-4 sm:mx-4 lg:mx-6"
      aria-labelledby="titulo-problema-logistico"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="bg-warning-light text-warning-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="titulo-problema-logistico" className="font-semibold">
              Problema logístico
            </h2>
            <Badge variant="warning">Indisponível para venda</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Este produto está indisponível para venda porque possui informações
            de envio incompletas ou inválidas.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Origem identificada: {diagnostico.origem.rotulo}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {campos.map((campo) => {
              const problema = diagnostico.problemas.find((item) =>
                (campo.codigos as readonly string[]).includes(item.codigo),
              );
              return (
                <div
                  key={campo.rotulo}
                  className="bg-background/80 rounded-lg border px-3 py-2"
                >
                  <dt className="text-muted-foreground text-xs">
                    {campo.rotulo}
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-xs font-medium">
                    {problema ? (
                      <>
                        <CircleX
                          className="text-destructive size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {problema.mensagemAdmin.replace(
                          new RegExp(`^${campo.rotulo}\\s*`, "i"),
                          "",
                        ) || "Inválido"}
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          className="text-success size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        OK
                      </>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          {problemaTransporte && diagnostico.origem.chave === "laquila" ? (
            <div className="bg-background/80 mt-4 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Como corrigir</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  Produtos Laquila devem usar expedição pelo fornecedor, sem
                  entrega própria. Acesse Entrega › Expedição Laquila e aplique
                  a configuração indicada.
                </p>
              </div>
              {aoAbrirConfiguracaoTransporte ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={aoAbrirConfiguracaoTransporte}
                >
                  Abrir configuração
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
