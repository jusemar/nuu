import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  CategoriaFidelidade,
  RegraCategoriaFidelidade,
} from "../../types/programa-fidelidade.types";

type Props = {
  categorias: CategoriaFidelidade[];
  regras: RegraCategoriaFidelidade[];
  pontosPadrao: number;
  editar: (categoria: CategoriaFidelidade) => void;
  atualizar: (id: string, mudanca: Partial<RegraCategoriaFidelidade>) => void;
};

function obterRegra(categoriaId: string, regras: RegraCategoriaFidelidade[]) {
  return regras.find((regra) => regra.categoriaId === categoriaId)!;
}
function obterTaxa(
  categoriaId: string,
  regras: RegraCategoriaFidelidade[],
  pontosPadrao: number,
) {
  const regra = obterRegra(categoriaId, regras);
  return regra.personalizada ? regra.pontosPorReal : pontosPadrao;
}

export function ListaCategoriasFidelidade({
  categorias,
  regras,
  pontosPadrao,
  editar,
  atualizar,
}: Props) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Categoria</TableHead>
              <TableHead>Regra</TableHead>
              <TableHead className="text-right">Pontos (30d)</TableHead>
              <TableHead className="text-center">Ativa</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((categoria) => {
              const regra = obterRegra(categoria.id, regras);
              return (
                <TableRow
                  key={categoria.id}
                  className="group cursor-pointer"
                  onClick={() => editar(categoria)}
                >
                  <TableCell className="pl-5">
                    <div className="font-medium">{categoria.nome}</div>
                    <div className="text-muted-foreground text-xs">
                      {categoria.grupo} · {categoria.produtos} produtos
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={regra.personalizada ? "secondary" : "outline"}
                      >
                        R$ 1 ={" "}
                        {obterTaxa(
                          categoria.id,
                          regras,
                          pontosPadrao,
                        ).toLocaleString("pt-BR")}{" "}
                        pt
                      </Badge>
                      {regra.personalizada ? (
                        <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                          Personalizada
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {regra.ativa
                      ? categoria.pontosUltimos30Dias.toLocaleString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell
                    className="text-center"
                    onClick={(evento) => evento.stopPropagation()}
                  >
                    <Switch
                      checked={regra.ativa}
                      onCheckedChange={(ativa) =>
                        atualizar(categoria.id, { ativa })
                      }
                      aria-label={`Ativar ${categoria.nome}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Pencil className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y md:hidden">
        {categorias.map((categoria) => {
          const regra = obterRegra(categoria.id, regras);
          return (
            <li key={categoria.id}>
              <button
                type="button"
                onClick={() => editar(categoria)}
                className="hover:bg-muted/50 flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{categoria.nome}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge
                      variant={regra.personalizada ? "secondary" : "outline"}
                    >
                      R$ 1 ={" "}
                      {obterTaxa(
                        categoria.id,
                        regras,
                        pontosPadrao,
                      ).toLocaleString("pt-BR")}{" "}
                      pt
                    </Badge>
                    {!regra.ativa ? (
                      <span className="text-muted-foreground text-xs">
                        desativada
                      </span>
                    ) : null}
                  </div>
                </div>
                <Pencil className="text-muted-foreground size-4 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
