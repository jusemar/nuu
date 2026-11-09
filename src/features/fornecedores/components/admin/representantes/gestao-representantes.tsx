"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { salvarAutorizacaoProdutoRepresentante } from "@/features/fornecedores/actions/representantes/salvar-autorizacao-produto-representante";
import { salvarVinculoRepresentante } from "@/features/fornecedores/actions/representantes/salvar-vinculo-representante";
import type { listarGestaoRepresentantes } from "@/features/fornecedores/queries/representantes/listar-gestao-representantes";

type Dados = Awaited<ReturnType<typeof listarGestaoRepresentantes>>;

/** Cada clique persiste uma escolha explícita; a página recarrega o estado salvo. */
export function GestaoRepresentantes({ dados }: { dados: Dados }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [operando, definirOperando] = useState<string | null>(null);
  const base = "/admin/fornecedores/representantes";
  const destino = (
    fornecedor?: string,
    representante?: string,
    pagina?: number,
  ) =>
    `${base}?${new URLSearchParams({ ...(fornecedor ? { fornecedor } : {}), ...(representante ? { representante } : {}), ...(pagina ? { pagina: String(pagina) } : {}) })}`;
  const navegar = (fornecedor?: string, representante?: string) =>
    router.push(destino(fornecedor, representante));
  const executar = (chave: string, acao: () => Promise<unknown>) => {
    definirOperando(chave);
    iniciar(async () => {
      try {
        await acao();
        toast.success("Alteração salva.");
        router.refresh();
      } catch {
        toast.error(
          "Não foi possível salvar. Confira o vínculo e tente novamente.",
        );
      } finally {
        definirOperando(null);
      }
    });
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-6 pb-28 sm:px-6 sm:pb-8">
      <div className="space-y-2">
        <Link
          href="/admin/fornecedores"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Fornecedores
        </Link>
        <h1 className="text-2xl font-semibold">
          Representantes de fornecedores
        </h1>
        <p className="text-muted-foreground text-sm">
          Vínculo com fornecedor e liberação de produto são decisões separadas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Escolha o fornecedor e o representante
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Fornecedor
            <select
              aria-label="Fornecedor"
              className="bg-background w-full rounded-md border p-2"
              value={dados.fornecedorSelecionado?.id ?? ""}
              onChange={(e) => navegar(e.target.value || undefined)}
            >
              <option value="">Selecione um fornecedor</option>
              {dados.fornecedores.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Administrador com função Representante fornecedor
            <select
              aria-label="Representante"
              className="bg-background w-full rounded-md border p-2"
              value={dados.representanteSelecionado?.id ?? ""}
              onChange={(e) =>
                navegar(
                  dados.fornecedorSelecionado?.id,
                  e.target.value || undefined,
                )
              }
            >
              <option value="">Selecione um representante</option>
              {dados.representantes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.email}
                </option>
              ))}
            </select>
          </label>
          {dados.representanteSelecionado && (
            <p className="text-muted-foreground text-xs break-all sm:col-span-2">
              Selecionado: {dados.representanteSelecionado.nome} ·{" "}
              {dados.representanteSelecionado.email}
            </p>
          )}
          {dados.representantes.length === 0 && (
            <p className="text-muted-foreground text-sm sm:col-span-2">
              Nenhum administrador ativo possui essa função. Convide ou atribua
              a função em{" "}
              <Link
                className="underline"
                href="/admin/configuracoes/usuarios-e-permissoes"
              >
                Usuários e permissões
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
      {dados.fornecedorSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Representantes vinculados a {dados.fornecedorSelecionado.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dados.vinculos.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Ainda não há representantes vinculados.
              </p>
            )}
            {dados.vinculos.map((vinculo) => {
              const pessoa = dados.representantes.find(
                (item) => item.id === vinculo.usuarioId,
              );
              return (
                <div
                  key={vinculo.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                >
                  <span>{pessoa?.nome ?? "Representante indisponível"}</span>
                  <Badge variant={vinculo.ativo ? "default" : "secondary"}>
                    {vinculo.ativo ? "Ativo" : "Revogado"}
                  </Badge>
                </div>
              );
            })}
            {dados.representanteSelecionado && (
              <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                <span className="text-sm">
                  {dados.representanteSelecionado.nome}:{" "}
                  {dados.vinculo?.ativo ? "vínculo ativo" : "sem vínculo ativo"}
                </span>
                <Button
                  disabled={pendente || operando !== null}
                  variant={dados.vinculo?.ativo ? "destructive" : "default"}
                  onClick={() =>
                    executar("vinculo", () =>
                      salvarVinculoRepresentante({
                        usuarioId: dados.representanteSelecionado!.id,
                        fornecedorId: dados.fornecedorSelecionado!.id,
                        ativo: !dados.vinculo?.ativo,
                      }),
                    )
                  }
                >
                  {dados.vinculo?.ativo ? "Revogar vínculo" : "Ativar vínculo"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {dados.fornecedorSelecionado && dados.representanteSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produtos do fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Página {dados.pagina} de {Math.max(1, dados.totalPaginas)}. Cada
              autorização é individual para este representante.
            </p>
            {dados.produtos.length === 0 && (
              <p className="text-sm">
                Nenhum produto comercialmente vinculado a este fornecedor.
              </p>
            )}
            {dados.produtos.map((produto) => {
              const autorizado = dados.autorizacoes[produto.id] === true;
              return (
                <div
                  key={produto.id}
                  className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-words">{produto.nome}</p>
                    <p className="text-muted-foreground text-xs break-all">
                      SKU {produto.sku} · Código fornecedor{" "}
                      {produto.codigoFornecedor ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={autorizado ? "default" : "secondary"}>
                      {autorizado ? "Autorizado" : "Não autorizado"}
                    </Badge>
                    <Button
                      size="sm"
                      variant={autorizado ? "outline" : "default"}
                      disabled={
                        !dados.vinculo?.ativo || pendente || operando !== null
                      }
                      onClick={() =>
                        executar(produto.id, () =>
                          salvarAutorizacaoProdutoRepresentante({
                            representanteFornecedorId: dados.vinculo!.id,
                            produtoId: produto.id,
                            ativa: !autorizado,
                          }),
                        )
                      }
                    >
                      {autorizado ? "Revogar" : "Autorizar"}
                    </Button>
                  </div>
                </div>
              );
            })}
            {!dados.vinculo?.ativo && (
              <p className="text-muted-foreground text-sm">
                Ative o vínculo antes de autorizar produtos.
              </p>
            )}
            {dados.totalPaginas > 1 && (
              <div className="flex items-center justify-between gap-3 pt-3">
                <Button
                  variant="outline"
                  disabled={dados.pagina <= 1}
                  onClick={() =>
                    router.push(
                      destino(
                        dados.fornecedorSelecionado?.id,
                        dados.representanteSelecionado?.id,
                        dados.pagina - 1,
                      ),
                    )
                  }
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  {dados.pagina}/{dados.totalPaginas}
                </span>
                <Button
                  variant="outline"
                  disabled={dados.pagina >= dados.totalPaginas}
                  onClick={() =>
                    router.push(
                      destino(
                        dados.fornecedorSelecionado?.id,
                        dados.representanteSelecionado?.id,
                        dados.pagina + 1,
                      ),
                    )
                  }
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
