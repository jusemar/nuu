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
import { AjudaFreteExterno } from "@/features/admin/logistica/components/frete-externo/ajuda-frete-externo";
import { ResumoFreteExternoEfetivo } from "@/features/admin/logistica/components/frete-externo/resumo-frete-externo-efetivo";
import { SeletorModoFreteExterno } from "@/features/admin/logistica/components/frete-externo/seletor-modo-frete-externo";
import { buscarCadeiaFreteExternoAdmin } from "@/features/admin/logistica/queries/frete-externo/buscar-cadeia-frete-externo-admin";
import { chavesFreteExterno } from "@/features/logistica/constants/chaves-query-logistica";
import { resolverDisponibilidadeFreteExterno } from "@/features/logistica/lib/disponibilidade/resolver-disponibilidade-frete-externo";
import type { ModoDisponibilidadeFreteExterno } from "@/features/logistica/types/disponibilidade-frete-externo";

import { salvarDisponibilidadeFreteExternoCategoria } from "../actions/disponibilidade-frete-externo-categoria";

/**
 * Categoria → Logística → Frete Externo. Salva de forma independente do
 * formulário principal (mesmo padrão da seção de FAQ).
 */
export function SecaoFreteExternoCategoria({
  categoriaId,
}: {
  categoriaId?: string;
}) {
  const queryClient = useQueryClient();
  const cadeia = useQuery({
    queryKey: chavesFreteExterno.cadeiaCategoria(categoriaId ?? null),
    queryFn: () => buscarCadeiaFreteExternoAdmin(categoriaId ?? null),
    enabled: Boolean(categoriaId),
  });
  const salvo = cadeia.data?.[0]?.modo ?? "herdar";
  const [modo, setModo] = useState<ModoDisponibilidadeFreteExterno>(salvo);
  useEffect(() => setModo(salvo), [salvo]);

  const salvar = useMutation({
    mutationFn: () =>
      salvarDisponibilidadeFreteExternoCategoria({ categoriaId, modo }),
    onSuccess: async (resultado) => {
      if (!resultado.sucesso) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Frete Externo da categoria salvo.");
      // Subcategorias e produtos desta categoria herdam o novo valor.
      await queryClient.invalidateQueries({
        queryKey: chavesFreteExterno.todas,
      });
    },
    onError: () => toast.error("Não foi possível salvar o Frete Externo."),
  });

  // Produtos em "Herdar" desta categoria: a categoria vale como se fosse o
  // primeiro nível da cadeia, com o modo escolhido na tela.
  const efetivo = resolverDisponibilidadeFreteExterno({
    modoProduto: "herdar",
    cadeiaCategorias: cadeia.data?.length
      ? [{ ...cadeia.data[0]!, modo }, ...cadeia.data.slice(1)]
      : [],
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <CardTitle className="text-base">Logística · Frete Externo</CardTitle>
          <AjudaFreteExterno />
        </div>
        <CardDescription>
          Vale para os produtos desta categoria (e das subcategorias) que
          estiverem em “Herdar da categoria”. Produto com valor próprio vence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!categoriaId ? (
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            Salve a categoria para configurar o Frete Externo. Até lá ela herda
            a configuração superior.
          </p>
        ) : cadeia.isError ? (
          <p className="text-sm text-red-600">
            Não foi possível carregar o Frete Externo da categoria.
          </p>
        ) : (
          <>
            <SeletorModoFreteExterno
              id="frete-externo-categoria"
              valor={modo}
              rotuloHerdar="Herdar da categoria superior"
              desabilitado={cadeia.isLoading || salvar.isPending}
              aoAlterar={setModo}
            />
            <ResumoFreteExternoEfetivo
              disponibilidade={efetivo}
              carregando={cadeia.isFetching}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => salvar.mutate()}
                disabled={
                  modo === salvo || salvar.isPending || cadeia.isLoading
                }
                className="w-full sm:w-auto"
              >
                {salvar.isPending ? "Salvando…" : "Salvar Frete Externo"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
