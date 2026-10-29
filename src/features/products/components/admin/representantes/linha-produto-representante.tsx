"use client";
import { Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  PerfilProdutosAdmin,
  ProdutoRepresentanteResumo,
} from "../../../types/representantes/produto-representante.types";
import { EditarCampoInline } from "./editar-campo-inline";
export function LinhaProdutoRepresentante({
  produto,
  perfil,
  comissaoVisivel,
}: {
  produto: ProdutoRepresentanteResumo;
  perfil: PerfilProdutosAdmin;
  comissaoVisivel: boolean;
}) {
  const [fornecedor, setFornecedor] = useState("");
  const contexto =
    produto.contextos.length === 1
      ? produto.contextos[0]
      : produto.contextos.find((c) => c.fornecedorId === fornecedor);
  const permitido =
    !!contexto &&
    contexto.comercialValido &&
    produto.editavel &&
    perfil.podeEscrever;
  const editar = (
    campo: "nome" | "precoCentavos" | "estoque",
    valor: string | number,
  ) => (
    <EditarCampoInline
      produtoId={produto.id}
      fornecedorId={contexto?.fornecedorId ?? ""}
      versao={produto.versao}
      campo={campo}
      valor={valor}
      permitido={permitido}
    />
  );
  const comissao = contexto?.comissao;
  const textoComissao = comissao
    ? comissao.tipo === "percentual"
      ? `${(comissao.valor / 100).toLocaleString("pt-BR")}%`
      : (comissao.valor / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
    : "—";
  // Uma só marcação atende desktop e cards mobile: não duplica inputs nem focos.
  return (
    <div
      role="row"
      className={`bg-card grid min-w-0 gap-3 rounded-xl border p-4 lg:items-center lg:rounded-none lg:border-0 lg:border-b ${comissaoVisivel ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.8fr)_auto]" : "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,.8fr)_auto]"}`}
    >
      <div role="cell" className="min-w-0">
        <div className="flex min-w-0 gap-3">
          <span className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md">
            {produto.imagem ? (
              <Image
                unoptimized
                width={480}
                height={320}
                src={produto.imagem}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Package className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            {editar("nome", produto.nome)}
            <p className="text-muted-foreground text-xs break-all">
              sku : {produto.sku}
            </p>
            <p className="text-muted-foreground text-xs break-all">
              Cód. fornecedor: {contexto?.codigoFornecedor || "Não informado"}
            </p>
          </div>
        </div>
        {produto.contextos.length > 1 && (
          <div className="mt-2">
            <Select value={fornecedor} onValueChange={setFornecedor}>
              <SelectTrigger
                className="h-11 w-full"
                aria-label="Fornecedor deste produto"
              >
                <SelectValue placeholder="Escolha o contexto de edição" />
              </SelectTrigger>
              <SelectContent>
                {produto.contextos.map((c) => (
                  <SelectItem key={c.fornecedorId} value={c.fornecedorId}>
                    {perfil.fornecedores.find((f) => f.id === c.fornecedorId)
                      ?.nome ?? "Fornecedor autorizado"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {!produto.editavel && (
          <p className="text-muted-foreground mt-1 text-xs">
            Edição disponível após revisão do gestor.
          </p>
        )}
      </div>
      <div role="cell" className="min-w-0">
        <span className="text-muted-foreground text-xs lg:hidden">Preço</span>
        <div>
          {produto.precoCentavos === null
            ? "Indisponível"
            : editar("precoCentavos", produto.precoCentavos)}
        </div>
      </div>
      <div role="cell" className="min-w-0">
        <span className="text-muted-foreground text-xs lg:hidden">Estoque</span>
        <div>
          {contexto
            ? editar("estoque", contexto.estoque)
            : "Escolha o contexto"}
        </div>
      </div>
      {comissaoVisivel && (
        <div role="cell" className="min-w-0">
          <span className="text-muted-foreground text-xs lg:hidden">
            Comissão
          </span>
          <p className="py-2 tabular-nums" title="Definida pelo gestor da Nooo">
            {textoComissao}
          </p>
        </div>
      )}
      <div role="cell">
        <Badge variant="secondary">
          {produto.situacao === "published"
            ? "Publicado"
            : produto.situacao === "archived"
              ? "Arquivado"
              : "Rascunho"}
        </Badge>
      </div>
      <div role="cell">
        {permitido ? (
          <Button
            asChild
            variant="outline"
            className="min-h-11 w-full lg:w-auto"
          >
            <Link
              href={`/admin/products/${produto.id}/edit?fornecedor=${contexto.fornecedorId}`}
            >
              Editar
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="min-h-11 w-full lg:w-auto"
            disabled
          >
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
