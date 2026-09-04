"use client";

// Tab de Entrega - Novas opções de entrega
// Combina: Retirada Local + Entrega Própria

import { CheckCircle2, Loader2, Package, Store, Truck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buscarResumoLogisticaProduto } from "@/features/admin/logistica/actions/produto-logistica/buscar-resumo-logistica-produto";
import { desvincularTipoLogisticoProduto } from "@/features/admin/logistica/actions/produto-logistica/desvincular-tipo-logistico-produto";
import { vincularTipoLogisticoProduto } from "@/features/admin/logistica/actions/produto-logistica/vincular-tipo-logistico-produto";
import { buscarModelosRetiradaAction } from "@/features/admin/logistica/actions/retirada/buscarModelos";
import { DimensoesFreteExterno } from "@/features/admin/logistica/components/produto/DimensoesFreteExterno";
import { ResumoLogisticaProduto } from "@/features/admin/logistica/components/produto/ResumoLogisticaProduto";
import { SecaoRetiradaProduto } from "@/features/admin/logistica/components/retirada-local/SecaoRetiradaProduto";
import type { ModeloRetirada } from "@/features/admin/logistica/types/logistica.types";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";
import { ProdutoEntregaPropriaPrecos } from "@/features/admin/logistics/entrega-propria/components/admin/produto-entrega-propria-precos";
import { EntregaPropriaInfoCard } from "@/features/admin/logistics/entrega-propria/components/EntregaPropriaInfoCard";
import type { ProductOwnDeliveryPriceFormItem } from "@/features/admin/logistics/entrega-propria/types/shipping";
import type { ResultadoListaTransportadorasLaquila } from "@/features/fornecedores/integracoes/laquila/queries/listar-transportadoras-laquila";

type Props = {
  data: {
    permiteRetirada?: boolean;
    modeloRetiradaId?: string | null;
    prazoCustom?: string;
    permiteEntregaPropria?: boolean;
    tiposEntregaPermitidos?: string[];
    aceitaPagamentoNaEntrega?: boolean;
    precosEntregaPropria?: ProductOwnDeliveryPriceFormItem[];
    classificacoesLogisticasIds?: string[];
  };
  productId?: string;
  onChange?: (updates: Partial<Props["data"]>) => void;
  dimensoesFrete?: DimensoesFreteExternoProduto;
  aoAlterarDimensoes?: (dimensoes: DimensoesFreteExternoProduto) => void;
  usaLogisticaLaquila?: boolean;
  resultadoTransportadorasLaquila?: ResultadoListaTransportadorasLaquila | null;
};

export function EntregaTab({
  data,
  productId,
  onChange,
  dimensoesFrete = {},
  aoAlterarDimensoes,
  usaLogisticaLaquila = false,
  resultadoTransportadorasLaquila = null,
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
    const tiposAtuais = data.tiposEntregaPermitidos ?? [];
    onChange?.({
      ...data,
      permiteEntregaPropria: checked,
      tiposEntregaPermitidos: checked
        ? Array.from(new Set([...tiposAtuais, "own"]))
        : tiposAtuais.filter((tipo) => tipo !== "own"),
    });
  };

  const configuracaoLaquilaCorreta =
    data.tiposEntregaPermitidos?.includes("supplier") === true &&
    !data.tiposEntregaPermitidos.includes("own") &&
    !data.permiteEntregaPropria;

  const aplicarConfiguracaoLaquila = () => {
    onChange?.({
      permiteEntregaPropria: false,
      aceitaPagamentoNaEntrega: false,
      precosEntregaPropria: [],
      tiposEntregaPermitidos: ["supplier"],
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
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {usaLogisticaLaquila ? (
        <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Logística Laquila
              </CardTitle>
              <Badge className="bg-emerald-600 hover:bg-emerald-600">
                Ativa
              </Badge>
            </div>
            <CardDescription>
              Este produto é separado e expedido pela Laquila. O frete é
              definido pela loja.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Tabs defaultValue="retirada" className="min-w-0 space-y-4 sm:space-y-6">
        <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-max justify-start">
            <TabsTrigger value="retirada" className="shrink-0 gap-2">
              <Store className="h-4 w-4" />
              Retirada Local
            </TabsTrigger>
            <TabsTrigger value="entrega-propria" className="shrink-0 gap-2">
              <Truck className="h-4 w-4" />
              {usaLogisticaLaquila ? "Expedição Laquila" : "Entrega Própria"}
            </TabsTrigger>
            <TabsTrigger value="regras-logisticas" className="shrink-0 gap-2">
              <Package className="h-4 w-4" />
              Frete Externo
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="retirada">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Retirada Local
              </CardTitle>
              <CardDescription>
                {usaLogisticaLaquila
                  ? "Indisponível porque o produto é expedido pela Laquila."
                  : "Configure a opção de retirada na loja para este produto."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usaLogisticaLaquila ? (
                <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Retirada pelo cliente</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      O produto não está disponível no ponto de retirada da
                      loja.
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    Indisponível
                  </Badge>
                </div>
              ) : modelos.length === 0 ? (
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
          {usaLogisticaLaquila ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Expedição pelo fornecedor
                </CardTitle>
                <CardDescription>
                  A Laquila separa e expede este produto. Entrega própria e
                  retirada local não fazem parte deste fluxo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Configuração exigida</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Entrega do fornecedor ativa e entrega própria desativada.
                    </p>
                  </div>
                  <Badge
                    variant={configuracaoLaquilaCorreta ? "default" : "warning"}
                    className="w-fit"
                  >
                    {configuracaoLaquilaCorreta
                      ? "Configurada"
                      : "Ajuste necessário"}
                  </Badge>
                </div>
                {!configuracaoLaquilaCorreta ? (
                  <Button type="button" onClick={aplicarConfiguracaoLaquila}>
                    Aplicar configuração Laquila
                  </Button>
                ) : null}
                <p className="text-muted-foreground text-xs">
                  Após aplicar, use “Atualizar” no topo para salvar o produto. A
                  transportadora do pedido é resolvida no checkout; Jadlog usa o
                  código Laquila 63993.
                </p>
              </CardContent>
            </Card>
          ) : (
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
                        Quando desativado, este produto não oferece Entrega
                        Própria na loja.
                      </p>
                    </div>
                    <Switch
                      checked={data.permiteEntregaPropria ?? false}
                      onCheckedChange={handleOwnDeliveryChange}
                    />
                  </div>

                  {/* Pagamento na entrega só existe dentro da entrega própria: é o entregador
                  da loja que recebe. Por isso o controle vive aqui e só aparece quando a
                  entrega própria está ligada — mostrá-lo antes sugeriria uma combinação
                  que o motor de elegibilidade nunca aprovaria. */}
                  {data.permiteEntregaPropria ? (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <div>
                        <Label className="font-medium">
                          Aceitar pagamento na entrega
                        </Label>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Permite que o cliente pague ao receber. A
                          disponibilidade final ainda depende do serviço de
                          entrega, do valor do pedido e da configuração em
                          Logística › Pagamento na Entrega.
                        </p>
                      </div>
                      <Switch
                        checked={data.aceitaPagamentoNaEntrega ?? false}
                        onCheckedChange={(marcado) =>
                          onChange?.({ aceitaPagamentoNaEntrega: marcado })
                        }
                      />
                    </div>
                  ) : null}

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
          )}
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
                const resposta =
                  await desvincularTipoLogisticoProduto(vinculoId);
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

      {usaLogisticaLaquila ? (
        <Card>
          <CardHeader>
            <CardTitle>Transportadoras Laquila</CardTitle>
            <CardDescription>
              Códigos de transportador aceitos pela integração Laquila. O frete
              e a etiqueta são definidos pela loja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Na integração Laquila, “O PROPRIO” identifica a coleta pela
              operação da loja, como motoboy ou Uber, e não a retirada pelo
              cliente.
            </p>
            {resultadoTransportadorasLaquila?.situacao === "erro" ? (
              <p className="text-muted-foreground text-sm">
                {resultadoTransportadorasLaquila.mensagem}
              </p>
            ) : resultadoTransportadorasLaquila?.situacao === "sucesso" &&
              resultadoTransportadorasLaquila.transportadoras.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {resultadoTransportadorasLaquila.transportadoras.map(
                  (transportadora) => (
                    <div
                      key={`${transportadora.codigo}:${transportadora.cnpj ?? ""}`}
                      className="rounded-lg border p-4"
                    >
                      <p className="font-mono text-sm font-semibold">
                        {transportadora.codigo}
                      </p>
                      <p className="mt-1 font-medium">
                        {transportadora.descricao}
                      </p>
                      {transportadora.cnpj ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          CNPJ: {transportadora.cnpj}
                        </p>
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhuma transportadora foi retornada pela Laquila.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
