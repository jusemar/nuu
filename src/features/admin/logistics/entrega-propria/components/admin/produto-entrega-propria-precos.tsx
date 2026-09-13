"use client";

import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Info,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  criarChaveDestinoEntregaPropria,
  formatarDiasEntregaPropria,
  formatarTipoDestinoEntregaPropria,
} from "../../lib/pesquisar-destinos-entrega-propria";
import {
  type EntregaPropriaDestinoProduto,
  listarDestinosEntregaPropriaProduto,
  listarPrecosEntregaPropriaProduto,
} from "../../queries/admin-entrega-propria.queries";
import type {
  OwnDeliveryDestinationType,
  ProductOwnDeliveryPriceFormItem,
} from "../../types/shipping";
import { SeletorDestinoEntregaPropria } from "./seletor-destino-entrega-propria";

type ProdutoEntregaPropriaPrecosProps = {
  productId?: string;
  value?: ProductOwnDeliveryPriceFormItem[];
  onChange: (items: ProductOwnDeliveryPriceFormItem[]) => void;
};

function formatarTipo(type: OwnDeliveryDestinationType) {
  return formatarTipoDestinoEntregaPropria(type);
}

function destinoKey(type: OwnDeliveryDestinationType, id: number) {
  return criarChaveDestinoEntregaPropria({ type, id });
}

function parseDestinoKey(value: string) {
  const [type, id] = value.split(":");

  return {
    type: type as OwnDeliveryDestinationType,
    id: Number(id),
  };
}

/**
 * Agenda de entrega do destino, SOMENTE LEITURA. Dias e corte vêm da Agenda
 * Geográfica (mesma resolução do motor público); o Produto define só preços.
 */
function ResumoAgendaDestino({
  destino,
}: {
  destino: EntregaPropriaDestinoProduto | undefined;
}) {
  if (!destino?.agendaEntrega) {
    return (
      <div className="mt-2 space-y-1.5 text-xs">
        <p className="text-amber-700">
          Sem agenda de entrega para este destino: a Entrega Própria não será
          oferecida até existir agenda na cidade, região, bairro ou CEP.
        </p>
        {destino?.configuracaoLogisticaHref ? (
          <Link
            href={destino.configuracaoLogisticaHref}
            className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
          >
            Ver Agenda Geográfica
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    );
  }

  const agenda = destino.agendaEntrega;
  const dias = formatarDiasEntregaPropria(agenda.diasDaSemana);

  return (
    <div className="mt-2 space-y-1.5 text-xs text-gray-600">
      <p className="font-medium text-gray-700">Agenda de entrega</p>
      <p className="flex items-start gap-1.5">
        <CalendarDays
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        />
        <span>
          <strong className="font-medium text-gray-700">Dias:</strong> {dias}
        </span>
      </p>
      <p className="flex items-center gap-1.5">
        <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-medium text-gray-700">
            Horário de corte:
          </strong>{" "}
          {agenda.horarioCorte}
        </span>
      </p>
      <p>
        <strong className="font-medium text-gray-700">Origem:</strong>{" "}
        {agenda.origem}
      </p>
      <Link
        href={agenda.configuracaoHref}
        className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
      >
        Ver Agenda Geográfica
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function ProdutoEntregaPropriaPrecos({
  productId,
  value = [],
  onChange,
}: ProdutoEntregaPropriaPrecosProps) {
  const [destinos, setDestinos] = useState<EntregaPropriaDestinoProduto[]>([]);
  const [selectedDestination, setSelectedDestination] = useState("");
  const [shippingPrice, setShippingPrice] = useState("");
  const [deliveryDeadline, setDeliveryDeadline] = useState("");
  const loadedExistingPricesRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    async function loadData() {
      const destinosData = await listarDestinosEntregaPropriaProduto();
      setDestinos(destinosData);

      if (productId && !loadedExistingPricesRef.current) {
        loadedExistingPricesRef.current = true;
        const precos = await listarPrecosEntregaPropriaProduto(productId);
        onChangeRef.current(
          precos.map((preco) => ({
            destinationType: preco.destinationType,
            destinationId: preco.destinationId,
            shippingPrice: preco.shippingPrice,
            rapidDeliveryActive: preco.rapidDeliveryActive,
            deliveryDeadline: preco.deliveryDeadline,
            scheduledDeliveryActive: preco.scheduledDeliveryActive,
            scheduledDeliveryMinDays: preco.scheduledDeliveryMinDays,
            scheduledDeliveryPrice: preco.scheduledDeliveryPrice,
            isActive: preco.isActive,
          })),
        );
      }
    }

    loadData();
  }, [productId]);

  const destinosPorChave = useMemo(() => {
    return new Map(
      destinos.map((destino) => [
        destinoKey(destino.type, destino.id),
        destino,
      ]),
    );
  }, [destinos]);

  const destinosDisponiveis = useMemo(() => {
    const usados = new Set(
      value.map((item) => destinoKey(item.destinationType, item.destinationId)),
    );

    return destinos.filter(
      (destino) => !usados.has(destinoKey(destino.type, destino.id)),
    );
  }, [destinos, value]);
  const destinoSelecionado = selectedDestination
    ? destinosPorChave.get(selectedDestination)
    : undefined;

  function handleAdd() {
    if (!selectedDestination) return;

    const destino = parseDestinoKey(selectedDestination);
    const priceInCents = Math.round(
      (Number(shippingPrice.replace(",", ".")) || 0) * 100,
    );

    onChange([
      ...value,
      {
        destinationType: destino.type,
        destinationId: destino.id,
        shippingPrice: priceInCents,
        rapidDeliveryActive: true,
        deliveryDeadline: deliveryDeadline.trim() || null,
        scheduledDeliveryActive: false,
        scheduledDeliveryMinDays: null,
        scheduledDeliveryPrice: null,
        isActive: true,
      },
    ]);

    setSelectedDestination("");
    setShippingPrice("");
    setDeliveryDeadline("");
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleToggle(index: number) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, isActive: !(item.isActive ?? true) }
          : item,
      ),
    );
  }

  function handlePriceChange(index: number, price: string) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              shippingPrice: Math.round(
                (Number(price.replace(",", ".")) || 0) * 100,
              ),
            }
          : item,
      ),
    );
  }

  function handleProgramadaChange(
    index: number,
    updates: Partial<ProductOwnDeliveryPriceFormItem>,
  ) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Truck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900">
                Preços de Entrega Própria por destino
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-gray-500"
                    aria-label="Como funciona a Entrega Própria"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Como funciona a Entrega Própria</DialogTitle>
                    <DialogDescription>
                      Entenda onde configurar calendário e preços.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm leading-6 text-gray-700">
                    <p>
                      Os dias de entrega e o horário de corte são definidos na
                      Agenda Geográfica, com herança entre cidade, região,
                      bairro e CEP. Nesta tela do produto você define os valores
                      e as opções de entrega para cada destino.
                    </p>
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="font-medium text-gray-900">Exemplo</p>
                      <p>
                        Se uma região atende segunda, quarta e sexta, com corte
                        às 13:00, e a Entrega Rápida cair na segunda-feira, uma
                        Entrega Programada configurada para uma próxima janela
                        será entregue na quarta-feira.
                      </p>
                    </div>
                    <p>
                      Os preços de cada modalidade continuam sendo definidos no
                      produto. O calendário é apenas consultado aqui e não pode
                      ser editado nesta tela.
                    </p>
                    <p className="font-medium text-gray-900">
                      Caminho da agenda: Logística → Entrega Própria → Agenda
                      Geográfica.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-gray-500">
              A logística define a cobertura. Aqui você define quanto este
              produto custa para cada destino atendido.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_160px_minmax(0,0.8fr)_auto]">
          <div className="space-y-2">
            <Label htmlFor="destino-entrega-propria">Destino cadastrado</Label>
            <SeletorDestinoEntregaPropria
              id="destino-entrega-propria"
              destinos={destinosDisponiveis}
              value={selectedDestination}
              onValueChange={setSelectedDestination}
            />
            {selectedDestination ? (
              <ResumoAgendaDestino destino={destinoSelecionado} />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Frete (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={shippingPrice}
              onChange={(event) => setShippingPrice(event.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label>Prazo opcional</Label>
            <Input
              value={deliveryDeadline}
              onChange={(event) => setDeliveryDeadline(event.target.value)}
              placeholder="Ex: 2 dias úteis"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!selectedDestination || !shippingPrice}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {value.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-7 text-center">
            <p className="font-medium text-gray-700">
              Nenhum preco de entrega propria configurado
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Sem preco para um destino, a loja exibira Consulte o vendedor.
            </p>
          </div>
        ) : (
          value.map((item, index) => {
            const destino = destinosPorChave.get(
              destinoKey(item.destinationType, item.destinationId),
            );

            return (
              <article
                key={destinoKey(item.destinationType, item.destinationId)}
                className="space-y-5 rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Destino
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {destino?.label ?? "Destino removido"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatarTipo(item.destinationType)}
                    {destino ? ` - ${destino.city}/${destino.state}` : ""}
                  </p>
                  <ResumoAgendaDestino destino={destino} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`frete-${index}`}>
                      Valor do frete (R$)
                    </Label>
                    <Input
                      id={`frete-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.shippingPrice / 100}
                      onChange={(event) =>
                        handlePriceChange(index, event.target.value)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`entrega-rapida-${index}`}
                        checked={item.rapidDeliveryActive ?? true}
                        onCheckedChange={(checked) =>
                          handleProgramadaChange(index, {
                            rapidDeliveryActive: checked,
                          })
                        }
                      />
                      <Label htmlFor={`entrega-rapida-${index}`}>
                        Entrega rápida ativa
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Prazo</p>
                    <p className="flex min-h-10 items-center text-sm text-gray-700">
                      {item.deliveryDeadline || (
                        <span className="text-gray-400">Padrão</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex min-h-10 items-center justify-between gap-3">
                    <Label htmlFor={`entrega-programada-${index}`}>
                      Entrega programada
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`entrega-programada-${index}`}
                        aria-label={`Ativar entrega programada para ${destino?.label ?? "destino"}`}
                        checked={item.scheduledDeliveryActive ?? false}
                        onCheckedChange={(checked) =>
                          handleProgramadaChange(index, {
                            scheduledDeliveryActive: checked,
                          })
                        }
                      />
                      <span className="min-w-12 text-sm font-medium text-gray-700">
                        {item.scheduledDeliveryActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                  </div>

                  {item.scheduledDeliveryActive ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`dias-programada-${index}`}>
                          Janelas após a rápida
                        </Label>
                        <Input
                          id={`dias-programada-${index}`}
                          type="number"
                          min="0"
                          value={item.scheduledDeliveryMinDays ?? 0}
                          onChange={(event) =>
                            handleProgramadaChange(index, {
                              scheduledDeliveryMinDays: Math.max(
                                0,
                                Number(event.target.value) || 0,
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`valor-programada-${index}`}>
                          Valor (R$)
                        </Label>
                        <Input
                          id={`valor-programada-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={(item.scheduledDeliveryPrice ?? 0) / 100}
                          onChange={(event) =>
                            handleProgramadaChange(index, {
                              scheduledDeliveryPrice: Math.round(
                                (Number(event.target.value.replace(",", ".")) ||
                                  0) * 100,
                              ),
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <div className="flex min-h-10 items-center gap-2">
                    <Switch
                      id={`status-destino-${index}`}
                      aria-label={`Alterar status de ${destino?.label ?? "destino"}`}
                      checked={item.isActive ?? true}
                      onCheckedChange={() => handleToggle(index)}
                    />
                    <Label htmlFor={`status-destino-${index}`}>Status</Label>
                    <Badge
                      variant={
                        (item.isActive ?? true) ? "default" : "secondary"
                      }
                    >
                      {(item.isActive ?? true) ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleRemove(index)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white lg:block">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Destino</TableHead>
              <TableHead className="w-40">Frete</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="min-w-64">Entrega programada</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {value.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center">
                  <p className="font-medium text-gray-700">
                    Nenhum preco de entrega propria configurado
                  </p>
                  <p className="text-sm text-gray-500">
                    Sem preco para um destino, a loja exibira Consulte o
                    vendedor.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              value.map((item, index) => {
                const destino = destinosPorChave.get(
                  destinoKey(item.destinationType, item.destinationId),
                );

                return (
                  <TableRow
                    key={destinoKey(item.destinationType, item.destinationId)}
                  >
                    <TableCell>
                      <p className="font-medium text-gray-900">
                        {destino?.label ?? "Destino removido"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatarTipo(item.destinationType)}
                        {destino ? ` - ${destino.city}/${destino.state}` : ""}
                      </p>
                      <ResumoAgendaDestino destino={destino} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Input
                          aria-label={`Valor do frete para ${destino?.label ?? "destino"}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.shippingPrice / 100}
                          onChange={(event) =>
                            handlePriceChange(index, event.target.value)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            aria-label={`Ativar entrega rápida para ${destino?.label ?? "destino"}`}
                            checked={item.rapidDeliveryActive ?? true}
                            onCheckedChange={(checked) =>
                              handleProgramadaChange(index, {
                                rapidDeliveryActive: checked,
                              })
                            }
                          />
                          <span className="text-xs text-gray-600">Rápida</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.deliveryDeadline || (
                        <span className="text-sm text-gray-400">Padrão</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            aria-label={`Ativar entrega programada para ${destino?.label ?? "destino"}`}
                            checked={item.scheduledDeliveryActive ?? false}
                            onCheckedChange={(checked) =>
                              handleProgramadaChange(index, {
                                scheduledDeliveryActive: checked,
                              })
                            }
                          />
                          <span className="text-xs font-medium">
                            {item.scheduledDeliveryActive ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        {item.scheduledDeliveryActive ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">
                                Janelas após a rápida
                              </Label>
                              <Input
                                aria-label="Janelas válidas após a entrega rápida"
                                type="number"
                                min="0"
                                value={item.scheduledDeliveryMinDays ?? 0}
                                onChange={(event) =>
                                  handleProgramadaChange(index, {
                                    scheduledDeliveryMinDays: Math.max(
                                      0,
                                      Number(event.target.value) || 0,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Valor (R$)</Label>
                              <Input
                                aria-label="Valor da entrega programada"
                                type="number"
                                min="0"
                                step="0.01"
                                value={(item.scheduledDeliveryPrice ?? 0) / 100}
                                onChange={(event) =>
                                  handleProgramadaChange(index, {
                                    scheduledDeliveryPrice: Math.round(
                                      (Number(
                                        event.target.value.replace(",", "."),
                                      ) || 0) * 100,
                                    ),
                                  })
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={item.isActive ?? true}
                          onCheckedChange={() => handleToggle(index)}
                        />
                        <Badge
                          variant={
                            (item.isActive ?? true) ? "default" : "secondary"
                          }
                        >
                          {(item.isActive ?? true) ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
