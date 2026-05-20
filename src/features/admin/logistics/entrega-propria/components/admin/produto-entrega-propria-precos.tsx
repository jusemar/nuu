"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  listarDestinosEntregaPropriaProduto,
  listarPrecosEntregaPropriaProduto,
  type EntregaPropriaDestinoProduto,
} from "../../queries/admin-entrega-propria.queries";
import type {
  OwnDeliveryDestinationType,
  ProductOwnDeliveryPriceFormItem,
} from "../../types/shipping";

type ProdutoEntregaPropriaPrecosProps = {
  productId?: string;
  value?: ProductOwnDeliveryPriceFormItem[];
  onChange: (items: ProductOwnDeliveryPriceFormItem[]) => void;
};

function formatarTipo(type: OwnDeliveryDestinationType) {
  const labels: Record<OwnDeliveryDestinationType, string> = {
    region: "Regiao",
    "bairro-avulso": "Bairro avulso",
    "cep-especifico": "CEP especifico",
  };

  return labels[type];
}

function destinoKey(type: OwnDeliveryDestinationType, id: number) {
  return `${type}:${id}`;
}

function parseDestinoKey(value: string) {
  const [type, id] = value.split(":");

  return {
    type: type as OwnDeliveryDestinationType,
    id: Number(id),
  };
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
            deliveryDeadline: preco.deliveryDeadline,
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
        deliveryDeadline: deliveryDeadline.trim() || null,
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

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              Precos de Entrega Propria por destino
            </h3>
            <p className="text-sm text-gray-500">
              A logistica define a cobertura. Aqui voce define quanto este
              produto custa para cada destino atendido.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_160px_minmax(0,0.8fr)_auto]">
          <div className="space-y-2">
            <Label>Destino cadastrado</Label>
            <Select
              value={selectedDestination}
              onValueChange={setSelectedDestination}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione regiao, bairro ou CEP" />
              </SelectTrigger>
              <SelectContent>
                {destinosDisponiveis.map((destino) => (
                  <SelectItem
                    key={destinoKey(destino.type, destino.id)}
                    value={destinoKey(destino.type, destino.id)}
                  >
                    {formatarTipo(destino.type)} - {destino.label} (
                    {destino.city}/{destino.state})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Destino</TableHead>
              <TableHead className="w-40">Frete</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {value.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center">
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
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.shippingPrice / 100}
                        onChange={(event) =>
                          handlePriceChange(index, event.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {item.deliveryDeadline || (
                        <span className="text-sm text-gray-400">Padrao</span>
                      )}
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
