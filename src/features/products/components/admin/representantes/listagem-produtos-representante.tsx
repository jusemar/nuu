"use client";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { consultarProdutosRepresentante } from "../../../actions/representantes/consultar-produtos-representante";
import { chavesProdutosRepresentante } from "../../../constants/representantes/query-keys";
import type { PerfilProdutosAdmin } from "../../../types/representantes/produto-representante.types";
import { LinhaProdutoRepresentante } from "./linha-produto-representante";
export function ListagemProdutosRepresentante({
  perfil,
}: {
  perfil: PerfilProdutosAdmin;
}) {
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTermo(busca);
      setPagina(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [busca]);
  const consulta = useQuery({
    queryKey: chavesProdutosRepresentante.lista(termo, pagina),
    queryFn: () => consultarProdutosRepresentante({ busca: termo, pagina }),
    staleTime: 0,
  });
  const exibirComissao =
    consulta.data?.produtos.some((p) =>
      p.contextos.some((c) => c.comissao !== null),
    ) ?? false;
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Consulte e gerencie os produtos autorizados para você.
          </p>
        </div>
        {perfil.podeEscrever && perfil.fornecedores.length > 0 && (
          <Button asChild className="min-h-11">
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              Novo produto
            </Link>
          </Button>
        )}
      </div>
      <Input
        aria-label="Pesquisar produtos"
        placeholder="Buscar por nome, SKU ou código"
        className="h-11"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {consulta.isPending && <p role="status">Carregando produtos…</p>}
      {consulta.isError && (
        <div role="alert" className="space-y-2">
          <p>
            Não foi possível consultar seus produtos. Seu acesso pode ter sido
            alterado.
          </p>
          <Button variant="outline" onClick={() => void consulta.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {consulta.data && (
        <>
          <div
            role="table"
            aria-label="Produtos autorizados"
            className="lg:bg-card min-w-0 space-y-3 lg:space-y-0 lg:overflow-hidden lg:rounded-xl lg:border"
          >
            <div
              role="row"
              className={`bg-muted text-muted-foreground hidden gap-3 p-4 text-xs lg:grid ${exibirComissao ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.8fr)_auto]" : "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,.8fr)_auto]"}`}
            >
              {[
                "Produto",
                "Preço",
                "Estoque",
                ...(exibirComissao ? ["Comissão"] : []),
                "Situação",
                "Ação",
              ].map((c) => (
                <span role="columnheader" key={c}>
                  {c}
                </span>
              ))}
            </div>
            {consulta.data.produtos.map((produto) => (
              <LinhaProdutoRepresentante
                key={produto.id}
                produto={produto}
                perfil={perfil}
                comissaoVisivel={exibirComissao}
              />
            ))}
            {!consulta.data.produtos.length && (
              <p className="p-5 text-sm">
                Nenhum produto autorizado encontrado.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              {consulta.data.total} produtos autorizados · Página {pagina}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11 flex-1"
                disabled={pagina === 1 || consulta.isFetching}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                className="min-h-11 flex-1"
                disabled={
                  pagina * 20 >= consulta.data.total || consulta.isFetching
                }
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
