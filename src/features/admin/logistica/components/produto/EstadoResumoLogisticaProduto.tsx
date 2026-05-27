import { AlertCircle, CheckCircle2 } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EstadoResumoLogisticaProduto({
  carregando,
  mensagem,
}: {
  carregando: boolean;
  mensagem: { tipo: "sucesso" | "erro"; texto: string } | null;
}) {
  return (
    <>
      {mensagem ? (
        <Card
          className={
            mensagem.tipo === "sucesso"
              ? "border-emerald-500/40"
              : "border-red-500/40"
          }
        >
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            {mensagem.tipo === "sucesso" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{mensagem.texto}</span>
          </CardContent>
        </Card>
      ) : null}

      {carregando ? (
        <Card>
          <CardHeader>
            <CardTitle>Regras Logísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
            <div className="bg-muted h-16 w-full animate-pulse rounded-md" />
            <div className="bg-muted h-16 w-full animate-pulse rounded-md" />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
