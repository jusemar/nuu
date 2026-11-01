"use client";
import { Mouse, UserRound } from "lucide-react";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { criarEnderecoPublicoJaaa } from "../../../lib/jaaa/endereco-publico-jaaa";
import { CartaoAcessoJaaa } from "../../jaaa/cartao-acesso-jaaa";
import { ConfigurarAtendimentoProduto } from "./configurar-atendimento-produto";
import {
  ConfigurarIdentidadeJaaa,
  type IdentidadeDemonstracao,
} from "./configurar-identidade-jaaa";
const iniciais: IdentidadeDemonstracao[] = [
  {
    id: "fernando",
    nome: "Fernando",
    fornecedor: "Embrater",
    identidade: "fernando_embrater",
    ativa: true,
  },
  {
    id: "beatriz",
    nome: "Beatriz",
    fornecedor: "Fornecedor B",
    identidade: "beatriz_atendimento",
    ativa: true,
  },
];
/** Revisão visual isolada: os dados são fictícios e não persistem fora desta página. */
export function PrevisualizacaoJaaa() {
  const [representantes, definirRepresentantes] = useState(iniciais),
    [atendimento, definirAtendimento] = useState(""),
    [aviso, definirAviso] = useState(""),
    [situacao, definirSituacao] = useState("ativo");
  const proprio = representantes[0],
    escolhido = representantes.find((r) => r.id === atendimento);
  const destino = (r: IdentidadeDemonstracao | undefined) =>
    situacao === "ativo" && r?.ativa
      ? criarEnderecoPublicoJaaa(r.identidade)
      : null;
  function salvar(id: string, identidade: string, ativa: boolean) {
    definirRepresentantes((rs) =>
      rs.map((r) => (r.id === id ? { ...r, identidade, ativa } : r)),
    );
    definirAviso("Configuração de demonstração atualizada.");
  }
  return (
    <main className="painel-admin bg-background min-h-dvh p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="bg-muted rounded-xl border p-4 text-sm">
          <strong>Etapa 8 · revisão visual</strong>
          <p>
            Dados fictícios. As alterações desta página não são gravadas.
            Nenhuma conta real está vinculada aos exemplos.
          </p>
        </div>
        <header>
          <h1 className="text-2xl font-semibold">Atendimento pelo Jaaa</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configuração simples para o gestor e acesso direto à conversa.
          </p>
        </header>
        <Tabs defaultValue="gestor" className="min-w-0 gap-4">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger className="min-h-11 min-w-0 px-1" value="gestor">
              Gestor
            </TabsTrigger>
            <TabsTrigger
              className="min-h-11 min-w-0 px-1"
              value="representante"
            >
              Representante
            </TabsTrigger>
            <TabsTrigger className="min-h-11 min-w-0 px-1" value="cliente">
              Cliente
            </TabsTrigger>
          </TabsList>
          <TabsContent value="gestor" className="min-w-0 space-y-4">
            <h2 className="text-lg font-semibold">Jaaa dos representantes</h2>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              {representantes.map((r) => (
                <ConfigurarIdentidadeJaaa
                  key={r.id}
                  representante={r}
                  salvar={salvar}
                />
              ))}
            </div>
            <ConfigurarAtendimentoProduto
              opcoes={representantes}
              selecionado={atendimento}
              salvar={(id) => {
                definirAtendimento(id);
                definirAviso("Atendimento de demonstração atualizado.");
              }}
            />
            {aviso && (
              <p role="status" className="text-sm">
                {aviso}
              </p>
            )}
          </TabsContent>
          <TabsContent value="representante" className="min-w-0 space-y-4">
            <div className="flex items-center justify-end gap-3">
              <UserRound className="size-10 rounded-full border p-2" />
              <div>
                <p className="font-semibold">Fernando</p>
                <p className="text-muted-foreground text-sm">Embrater</p>
              </div>
            </div>
            <h2 className="text-lg font-semibold">Meu atendimento</h2>
            <CartaoAcessoJaaa destino={destino(proprio)} />
          </TabsContent>
          <TabsContent value="cliente" className="min-w-0 space-y-4">
            <div className="bg-card grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <div className="bg-muted flex min-h-40 items-center justify-center rounded-lg">
                <Mouse
                  className="text-muted-foreground size-20"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Mouse sem fio</h2>
                <p className="text-muted-foreground text-sm">SKU: NOOO-002</p>
                <p className="text-xl font-semibold">R$ 89,90</p>
                <p className="text-muted-foreground text-sm">
                  A Nooo continua responsável pela venda.
                </p>
              </div>
            </div>
            <CartaoAcessoJaaa cliente destino={destino(escolhido)} />
          </TabsContent>
        </Tabs>
        <div className="bg-muted space-y-2 rounded-lg border p-4">
          <Label htmlFor="simular-situacao">
            Simular disponibilidade na revisão
          </Label>
          <select
            id="simular-situacao"
            className="border-input bg-background min-h-11 w-full min-w-0 rounded-md border px-2"
            value={situacao}
            onChange={(e) => definirSituacao(e.target.value)}
          >
            <option value="ativo">Disponível</option>
            <option value="sem_configuracao">Sem Jaaa configurado</option>
            <option value="desativada">Jaaa desativado</option>
            <option value="representante_inativo">Representante inativo</option>
            <option value="fornecedor_inativo">Fornecedor inativo</option>
            <option value="produto_nao_autorizado">
              Produto não autorizado
            </option>
          </select>
        </div>
      </div>
    </main>
  );
}
