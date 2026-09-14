"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import { formatarTipoDestinoEntregaPropria } from "../../../lib/pesquisar-destinos-entrega-propria";
import {
  type EntregaPropriaDestinoProduto,
  listarDestinosEntregaPropriaProduto,
} from "../../../queries/admin-entrega-propria.queries";
import type { CategoriaEntregaPropriaAdmin } from "../../../queries/entrega-propria-categoria.queries";
import { ResumoAgendaDestino } from "../produto-entrega-propria-precos";

const reais = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

/**
 * Condições de Entrega Própria fornecidas pela categoria, SOMENTE LEITURA,
 * dentro do Produto. Fechado por padrão; edição apenas na categoria.
 */
export function HerancaEntregaPropriaCategoria({
  categorias,
  produtoTemPrecosProprios,
}: {
  /** Categorias da cadeia que possuem preços, da mais próxima para a raiz. */
  categorias: CategoriaEntregaPropriaAdmin[];
  produtoTemPrecosProprios: boolean;
}) {
  const destinos = useQuery({
    queryKey: ["logistica", "entrega-propria", "destinos-admin"],
    queryFn: () => listarDestinosEntregaPropriaProduto(),
  });
  const principal = categorias[0];
  if (!principal) return null;
  const destinoPorChave = new Map(
    (destinos.data ?? []).map((destino: EntregaPropriaDestinoProduto) => [
      `${destino.type}:${destino.id}`,
      destino,
    ]),
  );

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-lg border border-blue-200 bg-blue-50/40"
    >
      <AccordionItem value="heranca" className="border-none">
        <AccordionTrigger className="px-4 text-left text-sm font-medium text-blue-950">
          Este produto usa configuração de Entrega Própria da categoria{" "}
          {principal.categoriaNome}
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-4">
          <p className="text-sm text-gray-700">
            {produtoTemPrecosProprios
              ? "Os preços próprios deste produto têm prioridade quando se aplicam ao endereço do cliente; nos demais destinos valem as condições abaixo."
              : "Não é preciso cadastrar estes destinos no produto: eles já são fornecidos pela categoria. Cadastre no produto somente exceções."}
          </p>
          {categorias.map((categoria) => (
            <section key={categoria.categoriaId} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {categoria.categoriaNome}
                  {categoria.nivel === "categoria-ancestral" ? (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (categoria superior)
                    </span>
                  ) : null}
                </p>
                <Link
                  href={`/admin/categories/${categoria.categoriaId}`}
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  Abrir configuração da categoria
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
              <ul className="grid gap-2 md:grid-cols-2">
                {categoria.precos.map((preco) => {
                  const destino = destinoPorChave.get(
                    `${preco.destinationType}:${preco.destinationId}`,
                  );
                  return (
                    <li
                      key={preco.id}
                      className="space-y-1 rounded-md border border-gray-200 bg-white p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900">
                          {preco.destinationLabel}
                          <span className="block text-xs font-normal text-gray-500">
                            {formatarTipoDestinoEntregaPropria(
                              preco.destinationType,
                            )}{" "}
                            · {preco.city}/{preco.state}
                          </span>
                        </p>
                        <Badge variant={preco.isActive ? "default" : "outline"}>
                          {preco.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p>
                        Rápida:{" "}
                        {preco.rapidDeliveryActive
                          ? reais(preco.shippingPrice)
                          : "desativada"}
                        {preco.deliveryDeadline
                          ? ` · ${preco.deliveryDeadline}`
                          : ""}
                      </p>
                      <p>
                        Programada:{" "}
                        {preco.scheduledDeliveryActive
                          ? `${preco.scheduledDeliveryPrice === 0 ? "GRÁTIS" : reais(preco.scheduledDeliveryPrice ?? 0)} · ${preco.scheduledDeliveryMinDays ?? 0} janela(s) após a rápida`
                          : "desativada"}
                      </p>
                      <ResumoAgendaDestino destino={destino} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
