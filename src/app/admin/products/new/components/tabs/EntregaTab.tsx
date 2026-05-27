"use client";

// Tab de Entrega - Novas opções de entrega
// Combina: Retirada Local + Entrega Própria

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Store, Truck, Loader2, Package } from "lucide-react";

import { SecaoRetiradaProduto } from "@/features/admin/logistica/components/retirada-local/SecaoRetiradaProduto";
import { EntregaPropriaInfoCard } from "@/features/admin/logistics/entrega-propria/components/EntregaPropriaInfoCard";
import { ProdutoEntregaPropriaPrecos } from "@/features/admin/logistics/entrega-propria/components/admin/produto-entrega-propria-precos";
import { buscarModelosRetiradaAction } from "@/features/admin/logistica/actions/retirada/buscarModelos";
import { buscarResumoLogisticaProduto } from "@/features/admin/logistica/actions/produto-logistica/buscar-resumo-logistica-produto";
import { desvincularTipoLogisticoProduto } from "@/features/admin/logistica/actions/produto-logistica/desvincular-tipo-logistico-produto";
import { vincularTipoLogisticoProduto } from "@/features/admin/logistica/actions/produto-logistica/vincular-tipo-logistico-produto";
import type { ModeloRetirada } from "@/features/admin/logistica/types/logistica.types";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";
import type { ProductOwnDeliveryPriceFormItem } from "@/features/admin/logistics/entrega-propria/types/shipping";
import { ResumoLogisticaProduto } from "@/features/admin/logistica/components/produto/ResumoLogisticaProduto";
import { DimensoesFreteExterno } from "@/features/admin/logistica/components/produto/DimensoesFreteExterno";

type Props = {
  data: {
    permiteRetirada?: boolean;
    modeloRetiradaId?: string | null;
    prazoCustom?: string;
    permiteEntregaPropria?: boolean;
    precosEntregaPropria?: ProductOwnDeliveryPriceFormItem[];
    classificacoesLogisticasIds?: string[];
  };
  productId?: string;
  onChange?: (updates: Partial<Props["data"]>) => void;
  dimensoesFrete?: DimensoesFreteExternoProduto;
  aoAlterarDimensoes?: (dimensoes: DimensoesFreteExternoProduto) => void;
};

export function EntregaTab({
  data,
  productId,
  onChange,
  dimensoesFrete = {},
  aoAlterarDimensoes,
}: Props) {
  const [modelos, setModelos] = useState<ModeloRetirada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<
    Array<{ id: string; nome: string; ativo: boolean }>
  >([]);
  const [tiposVinculados, setTiposVinculados] = useState<
    Array<{
      vinculoId: string;
      tipoLogisticoId: string;
      tipoLogisticoNome: string;
    }>
  >([]);
  const [regrasProduto, setRegrasProduto] = useState<
    Array<{
      id: string;
      efeito: "permitir" | "bloquear";
      ativo: boolean;
      provedorNome: string | null;
      transportadoraNome: string | null;
      servicoNome: string | null;
    }>
  >([]);
  const [carregandoResumoLogistica, setCarregandoResumoLogistica] =
    useState(false);
  const [mensagemResumoLogistica, setMensagemResumoLogistica] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  useEffect(() => {
    async function loadModelos() {
      try {
        const result = await buscarModelosRetiradaAction();
        setModelos(
          result.map((modelo) => ({
            ...modelo,
            ativo: modelo.ativo ?? false,
          })),
        );
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadModelos();
  }, []);

  useEffect(() => {
    async function carregarResumoLogistica() {
      setCarregandoResumoLogistica(true);
      try {
        const resumo = await buscarResumoLogisticaProduto(productId);
        setTiposDisponiveis(resumo.tiposDisponiveis);
        setTiposVinculados(resumo.tiposVinculados);
        setRegrasProduto(resumo.regrasProduto);
      } catch {
        setMensagemResumoLogistica({
          tipo: "erro",
          texto: "Não foi possível carregar as classificações logísticas.",
        });
      } finally {
        setCarregandoResumoLogistica(false);
      }
    }
    carregarResumoLogistica();
  }, [productId]);

  const recarregarResumoLogistica = async () => {
    if (!productId) return;
    setCarregandoResumoLogistica(true);
    const resumo = await buscarResumoLogisticaProduto(productId);
    setTiposDisponiveis(resumo.tiposDisponiveis);
    setTiposVinculados(resumo.tiposVinculados);
    setRegrasProduto(resumo.regrasProduto);
    setCarregandoResumoLogistica(false);
  };

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

  const handleOwnDeliveryChange = (checked: boolean) => {
    onChange?.({
      ...data,
      permiteEntregaPropria: checked,
    });
  };

  const handleOwnDeliveryPricesChange = (
    precos: ProductOwnDeliveryPriceFormItem[],
  ) => {
    onChange?.({
      ...data,
      precosEntregaPropria: precos,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
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
        <TabsTrigger value="regras-logisticas" className="gap-2">
          <Package className="h-4 w-4" />
          Frete Externo
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
              <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                <Store className="mb-3 h-12 w-12 opacity-50" />
                <p className="font-medium">
                  Nenhum modelo de retirada cadastrado
                </p>
                <p className="text-sm">
                  Acesse Logística › Retirada local para criar modelos.
                </p>
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
                Preços por destino
              </CardTitle>
              <CardDescription>
                Configure o preço da Entrega Própria deste produto para os
                destinos já cadastrados em Logística.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <Label className="font-medium">
                    Permitir Entrega Própria
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Quando desativado, este produto não oferece Entrega Própria
                    na loja.
                  </p>
                </div>
                <Switch
                  checked={data.permiteEntregaPropria ?? false}
                  onCheckedChange={handleOwnDeliveryChange}
                />
              </div>

              {data.permiteEntregaPropria ? (
                <ProdutoEntregaPropriaPrecos
                  productId={productId}
                  value={data.precosEntregaPropria ?? []}
                  onChange={handleOwnDeliveryPricesChange}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="regras-logisticas">
        <div className="space-y-6">
          <DimensoesFreteExterno
            dimensoes={dimensoesFrete}
            aoAlterar={aoAlterarDimensoes}
          />
          <ResumoLogisticaProduto
            produtoId={productId}
            tiposDisponiveis={tiposDisponiveis}
            tiposVinculados={tiposVinculados}
            regrasProduto={regrasProduto}
            classificacoesSelecionadasNoCadastro={
              data.classificacoesLogisticasIds ?? []
            }
            aoAlterarClassificacoesNoCadastro={(ids) =>
              onChange?.({ classificacoesLogisticasIds: ids })
            }
            carregando={carregandoResumoLogistica}
            mensagem={mensagemResumoLogistica}
            aoVincularTipo={async (tipoLogisticoId) => {
              if (!productId || !tipoLogisticoId) {
                setMensagemResumoLogistica({
                  tipo: "erro",
                  texto: "Selecione um tipo logístico para vincular.",
                });
                return;
              }

              setCarregandoResumoLogistica(true);
              const resposta = await vincularTipoLogisticoProduto({
                produtoId: productId,
                tipoLogisticoId,
              });

              if (!resposta.sucesso) {
                setMensagemResumoLogistica({
                  tipo: "erro",
                  texto: resposta.erro,
                });
                setCarregandoResumoLogistica(false);
                return;
              }

              await recarregarResumoLogistica();
              setMensagemResumoLogistica({
                tipo: "sucesso",
                texto: "Classificação logística vinculada com sucesso.",
              });
            }}
            aoDesvincularTipo={async (vinculoId) => {
              setCarregandoResumoLogistica(true);
              const resposta = await desvincularTipoLogisticoProduto(vinculoId);
              if (!resposta.sucesso) {
                setMensagemResumoLogistica({
                  tipo: "erro",
                  texto: resposta.erro,
                });
                setCarregandoResumoLogistica(false);
                return;
              }

              await recarregarResumoLogistica();
              setMensagemResumoLogistica({
                tipo: "sucesso",
                texto: "Classificação logística removida com sucesso.",
              });
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
