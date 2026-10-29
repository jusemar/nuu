"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useFormularioProdutoRepresentante } from "../../../hooks/representantes/use-formulario-produto-representante";
import type { PerfilProdutosAdmin } from "../../../types/representantes/produto-representante.types";
import { AbasFormularioProdutoRepresentante } from "./abas-formulario-produto-representante";
const abas = [
  { id: "basico", rotulo: "Básico" },
  { id: "preco", rotulo: "Preço" },
  { id: "imagens", rotulo: "Imagens" },
  { id: "dimensoes", rotulo: "Peso e dimensões" },
  { id: "garantia", rotulo: "Garantia" },
  { id: "seo", rotulo: "SEO" },
];
export function FormularioProdutoRepresentante({
  perfil,
  produtoId,
  fornecedorInicial,
}: {
  perfil: PerfilProdutosAdmin;
  produtoId?: string;
  fornecedorInicial?: string;
}) {
  const {
    fornecedorId,
    fornecedorValido,
    fornecedorEscolhido,
    setFornecedorEscolhido,
    aba,
    setAba,
    erro,
    opcoes,
    produto,
    formulario,
    salvar,
    errosFormulario,
  } = useFormularioProdutoRepresentante({
    perfil,
    produtoId,
    fornecedorInicial,
  });
  return (
    <form
      className="min-w-0 space-y-5"
      onSubmit={formulario.handleSubmit(
        (dados) => salvar.mutate(dados),
        errosFormulario,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {produtoId ? "Editar produto" : "Novo produto"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {produtoId
              ? "Atualize as informações deste produto autorizado."
              : "Cadastre um produto simples para o seu catálogo."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="min-h-11 flex-1">
            <Link href="/admin/products">Voltar</Link>
          </Button>
          <Button
            type="submit"
            className="min-h-11 flex-1"
            disabled={
              salvar.isPending ||
              !perfil.podeEscrever ||
              !fornecedorValido ||
              (!!produtoId && (!produto.data || produto.isFetching))
            }
          >
            {salvar.isPending
              ? "Salvando…"
              : produtoId
                ? "Salvar alterações"
                : "Salvar rascunho"}
          </Button>
        </div>
      </div>
      {perfil.fornecedores.length > 1 && !fornecedorInicial && (
        <div className="max-w-lg space-y-2">
          <label
            htmlFor="fornecedor-representado"
            className="text-sm font-medium"
          >
            Fornecedor representado *
          </label>
          <select
            id="fornecedor-representado"
            className="border-input bg-background h-11 w-full rounded-md border px-3"
            value={fornecedorEscolhido}
            onChange={(e) => setFornecedorEscolhido(e.target.value)}
          >
            <option value="">Selecione o fornecedor desta operação</option>
            {perfil.fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
      )}
      {erro && (
        <div
          role="alert"
          className="text-destructive rounded-lg border p-4 text-sm"
        >
          {erro}
        </div>
      )}
      {produto.isError && (
        <div
          role="alert"
          className="text-destructive rounded-lg border p-4 text-sm"
        >
          Não foi possível editar este produto. O acesso ou a estrutura
          comercial pode ter sido alterado. Volte à listagem ou solicite revisão
          ao gestor.
        </div>
      )}
      {opcoes.isPending ||
      (!!produtoId && produto.isPending && fornecedorValido) ? (
        <p role="status">Carregando formulário…</p>
      ) : opcoes.isError ? (
        <p role="alert">Não foi possível consultar categorias e marcas.</p>
      ) : opcoes.data && (!produtoId || produto.data) ? (
        <fieldset
          disabled={salvar.isPending || !perfil.podeEscrever}
          className="min-w-0"
        >
          <Tabs
            value={aba}
            onValueChange={setAba}
            className="min-w-0 gap-4 lg:flex-row"
          >
            <div className="min-w-0 overflow-x-auto border-b pb-2 lg:w-44 lg:shrink-0 lg:border-0">
              <TabsList className="h-auto w-max justify-start gap-1 bg-transparent p-0 lg:w-full lg:flex-col">
                {abas.map((a) => (
                  <TabsTrigger
                    key={a.id}
                    value={a.id}
                    className="min-h-11 shrink-0 justify-start px-3 lg:w-full"
                  >
                    {a.rotulo}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="min-w-0 flex-1">
              <AbasFormularioProdutoRepresentante
                formulario={formulario}
                opcoes={opcoes.data}
                produto={produto.data}
                produtoId={produtoId}
                fornecedorId={fornecedorId}
              />
              <p className="text-muted-foreground mt-4 text-xs">
                {produtoId
                  ? "A situação de publicação é administrada pelo gestor."
                  : "O produto será salvo como rascunho. A publicação permanece com o gestor."}
              </p>
            </div>
          </Tabs>
        </fieldset>
      ) : null}
    </form>
  );
}
