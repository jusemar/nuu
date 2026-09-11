import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  adicionarPrecoPoliticaEntregaPropria,
  excluirPrecoPoliticaEntregaPropria,
  salvarPoliticaEntregaPropria,
} from "../../actions/politicas-entrega-propria.actions";
import type { listarPoliticasEntregaPropriaAdmin } from "../../queries/politicas-entrega-propria.queries";

type Dados = Awaited<ReturnType<typeof listarPoliticasEntregaPropriaAdmin>>;
const DIAS = [
  [1, "Seg"],
  [2, "Ter"],
  [3, "Qua"],
  [4, "Qui"],
  [5, "Sex"],
  [6, "Sáb"],
  [0, "Dom"],
] as const;

export function PoliticasEntregaPropriaPage({
  politicas,
  categorias,
  produtos,
  modelosRetirada,
}: Dados) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <Button variant="ghost" asChild>
          <Link href="/admin/logistics/entrega-propria">← Entrega Própria</Link>
        </Button>
        <h1 className="text-2xl font-bold">Políticas de Entrega Própria</h1>
        <p className="text-muted-foreground text-sm">
          Exceções por produto ou categoria. Na ausência de correspondência, o
          comportamento atual continua sendo usado.
        </p>
        <p className="text-muted-foreground text-sm">
          Frenet e Jadlog continuam no motor existente de{" "}
          <Link
            className="underline"
            href="/admin/logistica/regras-disponibilidade"
          >
            regras de disponibilidade
          </Link>
          .
        </p>
      </header>

      <section className="bg-card rounded-xl border p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">Nova política</h2>
        <form action={salvarPoliticaEntregaPropria} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="escopo">Escopo</Label>
              <select
                id="escopo"
                name="escopo"
                className="bg-background h-10 w-full rounded-md border px-3"
                required
              >
                <option value="categoria">Categoria</option>
                <option value="produto">Produto</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alvoId">Produto ou categoria</Label>
              <Input
                id="alvoId"
                name="alvoId"
                list="alvos-politica"
                placeholder="Busque por nome/SKU e escolha o ID"
                required
              />
              <datalist id="alvos-politica">
                {categorias.map((item) => (
                  <option
                    key={`c-${item.id}`}
                    value={item.id}
                  >{`Categoria — ${item.nome}`}</option>
                ))}
                {produtos.map((item) => (
                  <option
                    key={`p-${item.id}`}
                    value={item.id}
                  >{`Produto — ${item.sku} — ${item.nome}`}</option>
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="ativa" defaultChecked /> Ativa
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="incluirDescendentes" /> Incluir
              descendentes
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="entregaRapidaAtiva" defaultChecked />{" "}
              Rápida ativa
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="entregaProgramadaAtiva" /> Programada
              ativa
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Dias atendidos</legend>
            <div className="flex flex-wrap gap-3">
              {DIAS.map(([valor, nome]) => (
                <label key={valor} className="flex items-center gap-1.5">
                  <input type="checkbox" name="diasAtendidos" value={valor} />{" "}
                  {nome}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="horarioCorte">Horário de corte</Label>
              <Input id="horarioCorte" name="horarioCorte" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazoMinimoProgramadaDias">
                Mínimo programada (dias)
              </Label>
              <Input
                id="prazoMinimoProgramadaDias"
                name="prazoMinimoProgramadaDias"
                type="number"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modeloRetiradaId">Modelo de retirada</Label>
              <select
                id="modeloRetiradaId"
                name="modeloRetiradaId"
                className="bg-background h-10 w-full rounded-md border px-3"
              >
                <option value="">Manter produto</option>
                {modelosRetirada.map((modelo) => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="configurarRetirada" /> Configurar
              retirada nesta política
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="permiteRetirada" /> Permitir retirada
            </label>
          </div>
          <Button type="submit">Salvar política</Button>
        </form>
      </section>

      <section className="space-y-4">
        {politicas.map((politica) => (
          <article
            key={politica.id}
            className="bg-card rounded-xl border p-4 sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">
                  {politica.escopo === "produto" ? "Produto" : "Categoria"}
                </h2>
                <p className="text-muted-foreground text-xs break-all">
                  {politica.produtoId ?? politica.categoriaId}
                </p>
              </div>
              <span className="rounded-full border px-2 py-1 text-xs">
                {politica.ativa ? "Ativa" : "Inativa"}
              </span>
            </div>
            <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <span>
                Rápida: {politica.entregaRapidaAtiva ? "ativa" : "inativa"}
              </span>
              <span>
                Programada:{" "}
                {politica.entregaProgramadaAtiva ? "ativa" : "inativa"}
              </span>
              <span>Dias: {politica.diasAtendidos.join(", ") || "—"}</span>
              <span>Corte: {politica.horarioCorte ?? "—"}</span>
            </div>
            <form
              action={adicionarPrecoPoliticaEntregaPropria}
              className="bg-muted/40 grid gap-3 rounded-lg p-3 md:grid-cols-5"
            >
              <input type="hidden" name="politicaId" value={politica.id} />
              <select
                name="tipoDestino"
                className="bg-background h-10 rounded-md border px-3"
                required
              >
                <option value="cep">CEP</option>
                <option value="bairro">Bairro</option>
                <option value="regiao">Região</option>
                <option value="cidade">Cidade</option>
                <option value="uf">UF</option>
              </select>
              <Input
                name="referencia"
                placeholder="CEP, UF ou ID do destino"
                required
              />
              <Input
                name="precoRapida"
                placeholder="Preço rápida"
                inputMode="decimal"
              />
              <Input
                name="precoProgramada"
                placeholder="Preço programada"
                inputMode="decimal"
              />
              <Button type="submit">Adicionar destino</Button>
            </form>
            <div className="mt-3 space-y-2">
              {politica.precos.map((preco) => (
                <div
                  key={preco.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
                >
                  <span>
                    {preco.tipoDestino.toUpperCase()} · rápida{" "}
                    {preco.precoRapidaEmCentavos === null
                      ? "—"
                      : `R$ ${(preco.precoRapidaEmCentavos / 100).toFixed(2)}`}{" "}
                    · programada{" "}
                    {preco.precoProgramadaEmCentavos === null
                      ? "—"
                      : `R$ ${(preco.precoProgramadaEmCentavos / 100).toFixed(2)}`}
                  </span>
                  <form action={excluirPrecoPoliticaEntregaPropria}>
                    <input type="hidden" name="id" value={preco.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Remover
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
