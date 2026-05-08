"use client";

// Tab de Entrega - Novas opções de entrega
// Combina: Retirada Local + Entrega Própria

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Truck, Loader2 } from "lucide-react";

import { SecaoRetiradaProduto } from "@/features/admin/logistica/components/retirada-local/SecaoRetiradaProduto";
import { ShippingPage } from "@/features/admin/logistics/entrega-propria/components/ShippingPage";
import { EntregaPropriaInfoCard } from "@/features/admin/logistics/entrega-propria/components/EntregaPropriaInfoCard";
import { buscarModelosRetiradaAction } from "@/features/admin/logistica/actions/retirada/buscarModelos";
import type { ModeloRetirada } from "@/features/admin/logistica/types/logistica.types";

type Props = {
  data: {
    permiteRetirada?: boolean;
    modeloRetiradaId?: string | null;
    prazoCustom?: string;
  };
  onChange?: (updates: Partial<Props["data"]>) => void;
};

export function EntregaTab({ data, onChange }: Props) {
  const [modelos, setModelos] = useState<ModeloRetirada[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadModelos() {
      try {
        const result = await buscarModelosRetiradaAction();
        setModelos(result);
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadModelos();
  }, []);

  const handleRetiradaChange = (dados: {
    habilitado: boolean;
    modeloId: string | null;
    prazoCustom: string;
  }) => {
    onChange?.({
      permiteRetirada: dados.habilitado,
      modeloRetiradaId: dados.modeloId,
      prazoCustom: dados.prazoCustom,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="retirada" className="space-y-6">
      <TabsList>
        <TabsTrigger value="retirada" className="gap-2">
          <Store className="h-4 w-4" />
          Retirada Local
        </TabsTrigger>
        <TabsTrigger value="entrega-propria" className="gap-2">
          <Truck className="h-4 w-4" />
          Entrega Própria
        </TabsTrigger>
      </TabsList>

      <TabsContent value="retirada">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Retirada Local
            </CardTitle>
            <CardDescription>
              Configure a opção de retirada na loja para este produto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modelos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Store className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">Nenhum modelo de retirada cadastrado</p>
                <p className="text-sm">Acesse Logística › Retirada local para criar modelos.</p>
              </div>
            ) : (
              <SecaoRetiradaProduto
                modelos={modelos}
                habilitado={data.permiteRetirada ?? false}
                modeloId={data.modeloRetiradaId ?? null}
                prazoCustom={data.prazoCustom ?? ""}
                onChange={handleRetiradaChange}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="entrega-propria">
        <div className="space-y-6">
          <EntregaPropriaInfoCard />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Configurar Zonas de Entrega
              </CardTitle>
              <CardDescription>
                Gerencie regiões, bairros avulsos e CEPs específicos para a entrega própria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShippingPage />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}