"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  consultarIdentidadesJaaa,
  consultarProdutosAtendimentoJaaa,
} from "../../../actions/jaaa/consultar-jaaa";
import { chavesJaaa } from "../../../constants/jaaa/chaves";
import { useSalvarJaaa } from "../../../hooks/jaaa/use-jaaa";
import { ConfiguracaoProdutoJaaa } from "./configuracao-produto-jaaa";
import { ConfigurarIdentidadeJaaa } from "./configurar-identidade-jaaa";
const buscaSchema = z.object({ busca: z.string().trim().max(150) });
/** Listas paginadas no servidor; configuração de produto é lida só quando aberta. */
export function PainelGestaoJaaa() {
  const [aba, setAba] = useState("representantes"),
    [termo, setTermo] = useState(""),
    [pagina, setPagina] = useState(1),
    [aberto, setAberto] = useState("");
  const buscaForm = useForm<z.infer<typeof buscaSchema>>({
    resolver: zodResolver(buscaSchema),
    defaultValues: { busca: "" },
  });
  const f = { busca: termo, pagina };
  const reps = useQuery({
      queryKey: chavesJaaa.identidades(f),
      queryFn: () => consultarIdentidadesJaaa(f),
      enabled: aba === "representantes",
    }),
    produtos = useQuery({
      queryKey: chavesJaaa.produtos(f),
      queryFn: () => consultarProdutosAtendimentoJaaa(f),
      enabled: aba === "produtos",
    }),
    gravar = useSalvarJaaa("identidade"),
    q = aba === "representantes" ? reps : produtos;
  const total = q.data?.total ?? 0;
  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Atendimento pelo Jaaa</h1>
        <p className="text-muted-foreground text-sm">
          Configure o usuário público de cada representante e o atendimento dos
          produtos.
        </p>
      </div>
      <Tabs
        value={aba}
        onValueChange={(v) => {
          setAba(v);
          setPagina(1);
          setAberto("");
        }}
      >
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger
            value="representantes"
            className="min-h-11"
            disabled={q.isPending}
          >
            Representantes
          </TabsTrigger>
          <TabsTrigger
            value="produtos"
            className="min-h-11"
            disabled={q.isPending}
          >
            Produtos
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <form
        className="flex min-w-0 gap-2"
        onSubmit={buscaForm.handleSubmit((d) => {
          setTermo(d.busca);
          setPagina(1);
          setAberto("");
        })}
      >
        <Input
          aria-label="Buscar atendimento"
          className="h-11 min-w-0"
          {...buscaForm.register("busca")}
          maxLength={150}
        />
        <Button className="min-h-11" type="submit">
          Buscar
        </Button>
      </form>
      {q.isPending ? (
        <p role="status">Carregando atendimento…</p>
      ) : q.isError ? (
        <p role="alert">Não foi possível consultar. Confira sua sessão.</p>
      ) : (
        <>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {aba === "representantes"
              ? reps.data?.linhas.map((r) => (
                  <ConfigurarIdentidadeJaaa
                    key={`${r.id}:${r.versao}`}
                    representante={r}
                    pendente={gravar.isPending}
                    salvar={(id, identidade, ativa) => {
                      if (!gravar.isPending)
                        gravar.mutate({ usuarioId: id, identidade, ativa });
                    }}
                  />
                ))
              : produtos.data?.linhas.map((p) => (
                  <article
                    key={p.id}
                    className="bg-card min-w-0 space-y-3 rounded-xl border p-4"
                  >
                    <h2 className="font-semibold break-words">{p.nome}</h2>
                    <p className="text-muted-foreground text-sm break-all">
                      SKU: {p.sku}
                    </p>
                    <Button
                      className="min-h-11 w-full"
                      variant="outline"
                      onClick={() => setAberto(aberto === p.id ? "" : p.id)}
                      aria-expanded={aberto === p.id}
                    >
                      Configurar atendimento
                    </Button>
                    {aberto === p.id && <ConfiguracaoProdutoJaaa id={p.id} />}
                  </article>
                ))}
          </div>
          {total === 0 && <p>Nenhum registro encontrado.</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              {total} registro(s) · Página {pagina}
            </p>
            <div className="flex gap-2">
              <Button
                className="min-h-11"
                variant="outline"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                className="min-h-11"
                variant="outline"
                disabled={pagina * 20 >= total}
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
