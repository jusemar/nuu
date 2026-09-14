"use client";

import { useQuery } from "@tanstack/react-query";

import { Label } from "@/components/ui/label";
import type { ModoDisponibilidadeEntregaPropria } from "@/db/table/logistics/entrega-propria/modo-disponibilidade-entrega-propria";
import { SeletorModoFreteExterno as SeletorModoHerdado } from "@/features/admin/logistica/components/frete-externo/seletor-modo-frete-externo";
import { chavesEntregaPropriaCategoria } from "@/features/logistica/constants/chaves-query-logistica";
import { resolverDisponibilidadeEntregaPropria } from "@/features/logistica/lib/entrega-propria/resolver-disponibilidade-entrega-propria";

import { buscarCadeiaEntregaPropriaCategoriaAdmin } from "../../../queries/entrega-propria-categoria.queries";
import { AjudaEntregaPropriaCategoria } from "./ajuda-entrega-propria-categoria";
import { HerancaEntregaPropriaCategoria } from "./heranca-entrega-propria-categoria";
import { ResumoDisponibilidadeEntregaPropria } from "./resumo-disponibilidade-entrega-propria";
import { DESCRICOES_MODO_ENTREGA_PROPRIA } from "./textos-modo-entrega-propria";

/**
 * Produto → Entrega Própria: Herdar da categoria / Ativado / Desativado,
 * com valor efetivo e as condições herdadas da categoria (somente leitura).
 * Usa as mesmas regras puras do motor público.
 */
export function DisponibilidadeEntregaPropriaProduto({
  valor,
  categoriaId,
  produtoTemPrecosProprios,
  aoAlterar,
}: {
  valor: ModoDisponibilidadeEntregaPropria;
  categoriaId: string | null;
  produtoTemPrecosProprios: boolean;
  aoAlterar: (modo: ModoDisponibilidadeEntregaPropria) => void;
}) {
  const cadeia = useQuery({
    queryKey: chavesEntregaPropriaCategoria.cadeia(categoriaId),
    queryFn: () => buscarCadeiaEntregaPropriaCategoriaAdmin(categoriaId),
  });
  const categorias = cadeia.data ?? [];
  const disponibilidade = resolverDisponibilidadeEntregaPropria({
    modoProduto: valor,
    cadeiaCategorias: categorias.map((categoria) => ({
      id: categoria.categoriaId,
      nome: categoria.categoriaNome,
      modo: categoria.modo,
    })),
    expedidoPorFornecedor: false,
  });
  const categoriasComPrecos = categorias.filter(
    (categoria) => categoria.precos.length > 0,
  );

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <Label className="font-medium">Permitir Entrega Própria</Label>
        <AjudaEntregaPropriaCategoria />
      </div>
      <p className="text-muted-foreground text-sm">
        “Herdar da categoria” usa a disponibilidade e as condições da categoria.
        Frete Externo e Retirada são configurados separadamente.
      </p>
      <SeletorModoHerdado
        id="entrega-propria-produto"
        valor={valor}
        rotuloHerdar="Herdar da categoria"
        rotuloGrupo="Disponibilidade da Entrega Própria"
        descricoes={DESCRICOES_MODO_ENTREGA_PROPRIA}
        aoAlterar={aoAlterar}
      />
      {cadeia.isError ? (
        <p className="text-sm text-red-600">
          Não foi possível carregar a Entrega Própria da categoria.
        </p>
      ) : (
        <ResumoDisponibilidadeEntregaPropria
          disponibilidade={disponibilidade}
          carregando={cadeia.isFetching}
        />
      )}
      {disponibilidade.ativo && categoriasComPrecos.length > 0 ? (
        <HerancaEntregaPropriaCategoria
          categorias={categoriasComPrecos}
          produtoTemPrecosProprios={produtoTemPrecosProprios}
        />
      ) : null}
    </div>
  );
}
