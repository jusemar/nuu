"use client";

import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buscarCadeiaFreteExternoAdmin } from "@/features/admin/logistica/queries/frete-externo/buscar-cadeia-frete-externo-admin";
import { chavesFreteExterno } from "@/features/logistica/constants/chaves-query-logistica";
import { resolverDisponibilidadeFreteExterno } from "@/features/logistica/lib/disponibilidade/resolver-disponibilidade-frete-externo";
import type { ModoDisponibilidadeFreteExterno } from "@/features/logistica/types/disponibilidade-frete-externo";

import { AjudaFreteExterno } from "../frete-externo/ajuda-frete-externo";
import { ResumoFreteExternoEfetivo } from "../frete-externo/resumo-frete-externo-efetivo";
import { SeletorModoFreteExterno } from "../frete-externo/seletor-modo-frete-externo";

/**
 * Produto → Entrega → Frete Externo: gate Herdar/Ativado/Desativado.
 * O valor efetivo usa a mesma regra da loja sobre a categoria selecionada no
 * formulário, então reflete a escolha antes mesmo de salvar.
 */
export function DisponibilidadeFreteExternoProduto({
  valor,
  categoriaId,
  usaLogisticaLaquila = false,
  aoAlterar,
}: {
  valor: ModoDisponibilidadeFreteExterno;
  categoriaId: string | null;
  usaLogisticaLaquila?: boolean;
  aoAlterar: (modo: ModoDisponibilidadeFreteExterno) => void;
}) {
  const cadeia = useQuery({
    queryKey: chavesFreteExterno.cadeiaCategoria(categoriaId),
    queryFn: () => buscarCadeiaFreteExternoAdmin(categoriaId),
    enabled: !usaLogisticaLaquila,
  });
  const disponibilidade = resolverDisponibilidadeFreteExterno({
    modoProduto: valor,
    cadeiaCategorias: cadeia.data ?? [],
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <CardTitle className="text-base">
            Disponibilidade do Frete Externo
          </CardTitle>
          <AjudaFreteExterno />
        </div>
        <CardDescription>
          Define se este produto pode oferecer PAC, Sedex, Jadlog e demais
          fretes externos. Não altera Entrega Própria nem Retirada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {usaLogisticaLaquila ? (
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            Não se aplica: este produto é expedido pela Laquila e segue a
            logística do fornecedor.
          </p>
        ) : (
          <>
            <SeletorModoFreteExterno
              id="frete-externo-produto"
              valor={valor}
              rotuloHerdar="Herdar da categoria"
              aoAlterar={aoAlterar}
            />
            {cadeia.isError ? (
              <p className="text-sm text-red-600">
                Não foi possível carregar a configuração da categoria.
              </p>
            ) : (
              <ResumoFreteExternoEfetivo
                disponibilidade={disponibilidade}
                carregando={cadeia.isFetching}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
