"use client";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { z } from "zod";

import { consultarPerfilProdutosAdmin } from "../../../actions/representantes/consultar-produtos-representante";
import { chavesProdutosRepresentante } from "../../../constants/representantes/query-keys";
import type { PerfilProdutosAdmin } from "../../../types/representantes/produto-representante.types";
import { FormularioProdutoRepresentante } from "./formulario-produto-representante";
import { ListagemProdutosRepresentante } from "./listagem-produtos-representante";

/** O layout mantém o chrome atual. As ações sempre revalidam a identidade no servidor. */
export function RotasProdutosRepresentante({
  perfilInicial,
}: {
  perfilInicial: PerfilProdutosAdmin;
}) {
  const caminho = usePathname();
  const parametros = useSearchParams();
  const consulta = useQuery({
    queryKey: chavesProdutosRepresentante.perfil(),
    queryFn: consultarPerfilProdutosAdmin,
    initialData: perfilInicial,
    staleTime: 0,
  });
  const perfil = consulta.data;
  if (consulta.isError || !perfil.representante || !perfil.fornecedores.length)
    return (
      <p role="alert" className="rounded-lg border p-4">
        Seu acesso aos produtos está indisponível. Solicite revisão ao gestor.
      </p>
    );
  if (caminho === "/admin/products")
    return <ListagemProdutosRepresentante perfil={perfil} />;
  if (caminho === "/admin/products/new")
    return <FormularioProdutoRepresentante perfil={perfil} />;
  const id = caminho.match(/^\/admin\/products\/([^/]+)\/edit$/)?.[1];
  if (id && z.uuid().safeParse(id).success)
    return (
      <FormularioProdutoRepresentante
        key={`${id}:${parametros.get("fornecedor") ?? ""}`}
        perfil={perfil}
        produtoId={id}
        fornecedorInicial={parametros.get("fornecedor") ?? undefined}
      />
    );
  return (
    <p role="alert">Esta operação não está disponível para representantes.</p>
  );
}
