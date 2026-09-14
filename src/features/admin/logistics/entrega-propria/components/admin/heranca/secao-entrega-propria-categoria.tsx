"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ModoDisponibilidadeEntregaPropria } from "@/db/table/logistics/entrega-propria/modo-disponibilidade-entrega-propria";
import { SeletorModoFreteExterno as SeletorModoHerdado } from "@/features/admin/logistica/components/frete-externo/seletor-modo-frete-externo";
import { chavesEntregaPropriaCategoria } from "@/features/logistica/constants/chaves-query-logistica";
import { resolverDisponibilidadeEntregaPropria } from "@/features/logistica/lib/entrega-propria/resolver-disponibilidade-entrega-propria";

import { salvarEntregaPropriaCategoria } from "../../../actions/entrega-propria-categoria.actions";
import { buscarCadeiaEntregaPropriaCategoriaAdmin } from "../../../queries/entrega-propria-categoria.queries";
import type { ProductOwnDeliveryPriceFormItem } from "../../../types/shipping";
import { ProdutoEntregaPropriaPrecos } from "../produto-entrega-propria-precos";
import { AjudaEntregaPropriaCategoria } from "./ajuda-entrega-propria-categoria";
import { ResumoDisponibilidadeEntregaPropria } from "./resumo-disponibilidade-entrega-propria";
import { DESCRICOES_MODO_ENTREGA_PROPRIA } from "./textos-modo-entrega-propria";

/**
 * Categoria → Entrega Própria: disponibilidade e condições comerciais padrão
 * por destino. Salva de forma independente do formulário da categoria.
 */
export function SecaoEntregaPropriaCategoria({
  categoriaId,
}: {
  categoriaId?: string;
}) {
  const queryClient = useQueryClient();
  const cadeia = useQuery({
    queryKey: chavesEntregaPropriaCategoria.cadeia(categoriaId ?? null),
    queryFn: () =>
      buscarCadeiaEntregaPropriaCategoriaAdmin(categoriaId ?? null),
    enabled: Boolean(categoriaId),
  });
  const propria = cadeia.data?.[0];
  const [modo, setModo] = useState<ModoDisponibilidadeEntregaPropria>("herdar");
  const [precos, setPrecos] = useState<ProductOwnDeliveryPriceFormItem[]>([]);
  useEffect(() => {
    if (!propria) return;
    setModo(propria.modo);
    setPrecos(propria.precos);
  }, [propria]);

  const salvar = useMutation({
    mutationFn: () =>
      salvarEntregaPropriaCategoria({ categoriaId, modo, precos }),
    onSuccess: async (resultado) => {
      if (!resultado.sucesso) return void toast.error(resultado.erro);
      toast.success("Entrega Própria da categoria salva.");
      await queryClient.invalidateQueries({
        queryKey: chavesEntregaPropriaCategoria.todas,
      });
    },
    onError: () => toast.error("Não foi possível salvar a Entrega Própria."),
  });

  // Efetivo para os produtos em "Herdar" desta categoria.
  const efetivo = resolverDisponibilidadeEntregaPropria({
    modoProduto: "herdar",
    cadeiaCategorias: (cadeia.data ?? []).map((categoria, indice) => ({
      id: categoria.categoriaId,
      nome: categoria.categoriaNome,
      modo: indice === 0 ? modo : categoria.modo,
    })),
    expedidoPorFornecedor: false,
  });
  const ancestralComPrecos = cadeia.data
    ?.slice(1)
    .find((categoria) => categoria.precos.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <CardTitle className="text-base">Entrega Própria</CardTitle>
          <AjudaEntregaPropriaCategoria />
        </div>
        <CardDescription>
          Condições padrão para os produtos desta categoria (e subcategorias)
          que herdam a Entrega Própria. Dias e corte vêm da Agenda Geográfica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!categoriaId ? (
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            Salve a categoria para configurar a Entrega Própria.
          </p>
        ) : cadeia.isError ? (
          <p className="text-sm text-red-600">
            Não foi possível carregar a Entrega Própria da categoria.
          </p>
        ) : (
          <>
            <SeletorModoHerdado
              id="entrega-propria-categoria"
              valor={modo}
              rotuloHerdar="Herdar da categoria superior"
              rotuloGrupo="Disponibilidade da Entrega Própria"
              descricoes={DESCRICOES_MODO_ENTREGA_PROPRIA}
              desabilitado={cadeia.isLoading || salvar.isPending}
              aoAlterar={setModo}
            />
            <ResumoDisponibilidadeEntregaPropria
              disponibilidade={efetivo}
              carregando={cadeia.isFetching}
            />
            {precos.length === 0 && ancestralComPrecos ? (
              <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                Sem preços próprios: os produtos usam as condições da categoria{" "}
                <strong>{ancestralComPrecos.categoriaNome}</strong>.
              </p>
            ) : null}
            <ProdutoEntregaPropriaPrecos
              contexto="categoria"
              value={precos}
              onChange={setPrecos}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => salvar.mutate()}
                disabled={salvar.isPending || cadeia.isLoading}
                className="w-full sm:w-auto"
              >
                {salvar.isPending ? "Salvando…" : "Salvar Entrega Própria"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
