// Server Component: a listagem, a busca (GET) e a paginação não precisam de
// JavaScript no cliente. Só o editor de cada destino e a ajuda são "use client".
import { MapPin, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { NivelAgendaGeograficaAdmin } from "../../queries/agenda-geografica-entrega-propria.queries";
import { AjudaAgendaGeograficaEntregaPropria } from "./ajuda-agenda-geografica-entrega-propria";
import { EditorAgendaGeograficaEntregaPropria } from "./editor-agenda-geografica-entrega-propria";

type ResultadoAgenda = Awaited<
  ReturnType<
    typeof import("../../queries/agenda-geografica-entrega-propria.queries").listarAgendaGeograficaEntregaPropriaAdmin
  >
>;

const NIVEIS: Array<{ valor: NivelAgendaGeograficaAdmin; rotulo: string }> = [
  { valor: "cidade", rotulo: "Cidades" },
  { valor: "regiao", rotulo: "Regiões" },
  { valor: "bairro", rotulo: "Bairros" },
  { valor: "cep", rotulo: "CEPs" },
];
const CAMINHO = "/admin/logistics/entrega-propria/agenda";

function criarHrefPagina({
  nivel,
  busca,
  pagina,
}: {
  nivel: NivelAgendaGeograficaAdmin;
  busca: string;
  pagina: number;
}) {
  const parametros = new URLSearchParams({ nivel });
  if (busca) parametros.set("busca", busca);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  return `${CAMINHO}?${parametros.toString()}`;
}

export function AgendaGeograficaEntregaPropriaPage({
  nivel,
  busca,
  resultado,
}: {
  nivel: NivelAgendaGeograficaAdmin;
  busca: string;
  resultado: ResultadoAgenda;
}) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 sm:p-6">
      <header>
        <Link
          href="/admin/logistics/entrega-propria"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Entrega Própria
        </Link>
        <div className="mt-3 flex items-center gap-1.5">
          <h1 className="text-2xl font-bold text-gray-900">
            Agenda Geográfica
          </h1>
          <AjudaAgendaGeograficaEntregaPropria />
        </div>
        <p className="mt-2 max-w-3xl text-gray-600">
          Única fonte de dias de entrega e horário de corte da Entrega Própria.
          A precedência é CEP → Bairro → Região → Cidade; sem agenda própria, o
          destino herda o nível superior. Preços são definidos no Produto.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Níveis geográficos">
        {NIVEIS.map((item) => (
          <Button
            key={item.valor}
            asChild
            variant={nivel === item.valor ? "default" : "outline"}
          >
            <Link href={`${CAMINHO}?nivel=${item.valor}`}>{item.rotulo}</Link>
          </Button>
        ))}
      </nav>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="nivel" value={nivel} />
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            name="busca"
            defaultValue={busca}
            className="pl-9"
            aria-label="Buscar destino na Agenda Geográfica"
            placeholder="Buscar cidade, região, bairro ou CEP"
          />
        </div>
        <Button type="submit">Buscar</Button>
        {busca ? (
          <Button asChild type="button" variant="outline">
            <Link href={`${CAMINHO}?nivel=${nivel}`}>Limpar</Link>
          </Button>
        ) : null}
      </form>

      <section className="space-y-3">
        {resultado.itens.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
            <MapPin className="mx-auto mb-3 h-8 w-8" aria-hidden="true" />
            {busca
              ? `Nenhum destino encontrado para “${busca}” neste nível.`
              : "Nenhum destino ativo cadastrado neste nível."}
          </div>
        ) : (
          resultado.itens.map((item) => (
            <EditorAgendaGeograficaEntregaPropria
              key={`${item.tipoDestino}:${item.destinoId}`}
              item={item}
            />
          ))
        )}
      </section>

      <footer className="flex flex-col gap-3 border-t pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Página {resultado.pagina} de {resultado.totalPaginas} ·{" "}
          {resultado.totalItens} destino(s)
        </p>
        <div className="flex gap-2">
          {resultado.pagina > 1 ? (
            <Button asChild size="sm" variant="outline">
              <Link
                href={criarHrefPagina({
                  nivel,
                  busca,
                  pagina: resultado.pagina - 1,
                })}
              >
                Anterior
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Anterior
            </Button>
          )}
          {resultado.pagina < resultado.totalPaginas ? (
            <Button asChild size="sm" variant="outline">
              <Link
                href={criarHrefPagina({
                  nivel,
                  busca,
                  pagina: resultado.pagina + 1,
                })}
              >
                Próxima
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Próxima
            </Button>
          )}
        </div>
      </footer>
    </main>
  );
}
