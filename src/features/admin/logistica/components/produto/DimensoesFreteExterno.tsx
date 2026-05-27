"use client";

import { Package } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";
import { AjudaContextualFreteExterno } from "./AjudaContextualFreteExterno";

type PropriedadesDimensoesFreteExterno = {
  dimensoes: DimensoesFreteExternoProduto;
  aoAlterar?: (dimensoes: DimensoesFreteExternoProduto) => void;
};

export function DimensoesFreteExterno({
  dimensoes,
  aoAlterar,
}: PropriedadesDimensoesFreteExterno) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Dimensões para Frete Externo
          <AjudaContextualFreteExterno
            titulo="Peso e dimensões"
            descricao="Usado para cálculo de frete e validação logística."
          />
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Usado para cálculo de frete externo.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="peso-frete-externo">Peso (kg)</Label>
            <Input
              id="peso-frete-externo"
              name="pesoEmKg"
              type="number"
              min="0"
              step="0.001"
              placeholder="0,000"
              value={dimensoes.pesoEmKg ?? ""}
              onChange={(evento) =>
                aoAlterar?.({ ...dimensoes, pesoEmKg: evento.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altura-frete-externo">Altura (cm)</Label>
            <Input
              id="altura-frete-externo"
              name="alturaEmCm"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={dimensoes.alturaEmCm ?? ""}
              onChange={(evento) =>
                aoAlterar?.({ ...dimensoes, alturaEmCm: evento.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="largura-frete-externo">Largura (cm)</Label>
            <Input
              id="largura-frete-externo"
              name="larguraEmCm"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={dimensoes.larguraEmCm ?? ""}
              onChange={(evento) =>
                aoAlterar?.({ ...dimensoes, larguraEmCm: evento.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comprimento-frete-externo">Comprimento (cm)</Label>
            <Input
              id="comprimento-frete-externo"
              name="comprimentoEmCm"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={dimensoes.comprimentoEmCm ?? ""}
              onChange={(evento) =>
                aoAlterar?.({
                  ...dimensoes,
                  comprimentoEmCm: evento.target.value,
                })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
