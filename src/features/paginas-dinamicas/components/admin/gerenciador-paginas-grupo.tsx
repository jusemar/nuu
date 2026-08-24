"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FilePlus2, Info, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PaginaDinamica } from "@/db/schema";

import {
  removerPaginaDoGrupo,
  reordenarPaginasDoGrupo,
} from "../../actions/vinculos-e-ordenacao";
import { filtrarPaginasAssociaveis } from "../../lib/filtrar-paginas-associaveis";
import type { GrupoNavegacaoComPaginas } from "../../types/paginas-dinamicas.types";
import {
  FormularioVinculoPagina,
  type VinculoEmEdicao,
} from "./formulario-vinculo-pagina";
import { ItemPaginaGrupo } from "./item-pagina-grupo";

type Vinculo = GrupoNavegacaoComPaginas["paginas"][number];
type Propriedades = {
  aberto: boolean;
  grupo: GrupoNavegacaoComPaginas | null;
  paginas: PaginaDinamica[];
  aoAlterarAbertura: (aberto: boolean) => void;
  aoAlterarVinculos: (grupoId: string, vinculos: Vinculo[]) => void;
};

export function GerenciadorPaginasGrupo({
  aberto,
  grupo,
  paginas,
  aoAlterarAbertura,
  aoAlterarVinculos,
}: Propriedades) {
  const router = useRouter();
  const [vinculos, setVinculos] = useState(() => grupo?.paginas ?? []);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [vinculoEdicao, setVinculoEdicao] = useState<Vinculo | null>(null);
  const [chaveFormulario, setChaveFormulario] = useState(0);
  const [vinculoRemocao, setVinculoRemocao] = useState<Vinculo | null>(null);
  const [ocupado, iniciarTransicao] = useTransition();
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const paginasDisponiveis = useMemo(() => {
    return filtrarPaginasAssociaveis(
      paginas,
      vinculos.map(({ paginaId }) => paginaId),
    );
  }, [paginas, vinculos]);

  if (!grupo) return null;
  const grupoAtual = grupo;

  function atualizarVinculos(novos: Vinculo[]) {
    setVinculos(novos);
    aoAlterarVinculos(grupoAtual.id, novos);
  }

  function abrirNovo() {
    setVinculoEdicao(null);
    setChaveFormulario((valor) => valor + 1);
    setFormularioAberto(true);
  }

  function abrirEdicao(vinculo: Vinculo) {
    setVinculoEdicao(vinculo);
    setChaveFormulario((valor) => valor + 1);
    setFormularioAberto(true);
  }

  function sincronizar() {
    aoAlterarAbertura(false);
    router.refresh();
  }

  function persistirOrdem(ordenados: Vinculo[], anteriores: Vinculo[]) {
    const normalizados = ordenados.map((vinculo, ordem) => ({
      ...vinculo,
      ordem,
    }));
    atualizarVinculos(normalizados);
    iniciarTransicao(async () => {
      const resultado = await reordenarPaginasDoGrupo({
        grupoId: grupoAtual.id,
        idsPaginasOrdenadas: normalizados.map(({ paginaId }) => paginaId),
      });
      if (!resultado.sucesso) {
        atualizarVinculos(anteriores);
        toast.error(resultado.mensagem);
        return;
      }
      toast.success("Ordem das páginas salva.");
      router.refresh();
    });
  }

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= vinculos.length) return;
    persistirOrdem(arrayMove(vinculos, indice, destino), vinculos);
  }

  function finalizarArraste(evento: DragEndEvent) {
    if (!evento.over || evento.active.id === evento.over.id) return;
    const origem = vinculos.findIndex(
      ({ paginaId }) => paginaId === evento.active.id,
    );
    const destino = vinculos.findIndex(
      ({ paginaId }) => paginaId === evento.over?.id,
    );
    if (origem < 0 || destino < 0) return;
    persistirOrdem(arrayMove(vinculos, origem, destino), vinculos);
  }

  function remover() {
    if (!vinculoRemocao) return;
    iniciarTransicao(async () => {
      const resultado = await removerPaginaDoGrupo({
        grupoId: grupoAtual.id,
        paginaId: vinculoRemocao.paginaId,
      });
      if (!resultado.sucesso) {
        toast.error(resultado.mensagem);
        return;
      }
      atualizarVinculos(vinculos.filter(({ id }) => id !== vinculoRemocao.id));
      setVinculoRemocao(null);
      toast.success("Página removida do grupo.");
      router.refresh();
    });
  }

  const dadosEdicao: VinculoEmEdicao | null = vinculoEdicao
    ? {
        paginaId: vinculoEdicao.paginaId,
        textoLink: vinculoEdicao.textoLink,
        ativo: vinculoEdicao.ativo,
      }
    : null;

  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Páginas de “{grupoAtual.tituloPublico}”</DialogTitle>
          <DialogDescription>
            Defina os links e a ordem deste grupo. Uma página pode participar de
            outros grupos.
          </DialogDescription>
        </DialogHeader>
        <Card className="border-primary/15 bg-primary/5">
          <CardContent className="flex gap-3 p-4">
            <Info className="text-primary mt-0.5 size-5 shrink-0" />
            <p className="text-muted-foreground text-sm">
              Páginas em rascunho, arquivadas ou com vínculo inativo não
              aparecerão futuramente no site.
            </p>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">
            {vinculos.length}{" "}
            {vinculos.length === 1 ? "página vinculada" : "páginas vinculadas"}
          </p>
          <Button
            size="sm"
            onClick={abrirNovo}
            disabled={!paginasDisponiveis.length || ocupado}
          >
            <Plus className="size-4" />
            Adicionar página
          </Button>
        </div>
        {vinculos.length ? (
          <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            onDragEnd={finalizarArraste}
          >
            <SortableContext
              items={vinculos.map(({ paginaId }) => paginaId)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-2" aria-busy={ocupado}>
                {vinculos.map((vinculo, indice) => (
                  <ItemPaginaGrupo
                    key={vinculo.id}
                    vinculo={vinculo}
                    indice={indice}
                    total={vinculos.length}
                    ocupado={ocupado}
                    aoEditar={() => abrirEdicao(vinculo)}
                    aoRemover={() => setVinculoRemocao(vinculo)}
                    aoMover={(direcao) => mover(indice, direcao)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed py-10 text-center">
            <FilePlus2 className="text-muted-foreground mb-3 size-8" />
            <p className="font-medium">Nenhuma página vinculada</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Adicione uma página existente para começar.
            </p>
          </div>
        )}
        {!paginasDisponiveis.length && paginas.length ? (
          <p className="text-muted-foreground text-xs">
            Não há outras páginas elegíveis. Arquivadas não podem ser
            adicionadas e duplicadas são bloqueadas.
          </p>
        ) : null}

        <FormularioVinculoPagina
          key={chaveFormulario}
          aberto={formularioAberto}
          grupoId={grupoAtual.id}
          paginasDisponiveis={
            vinculoEdicao ? [vinculoEdicao.pagina] : paginasDisponiveis
          }
          proximaOrdem={vinculos.length}
          vinculo={dadosEdicao}
          aoAlterarAbertura={setFormularioAberto}
          aoSalvar={sincronizar}
        />
        <Dialog
          open={Boolean(vinculoRemocao)}
          onOpenChange={(valor) => !valor && setVinculoRemocao(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover página do grupo?</DialogTitle>
              <DialogDescription>
                “{vinculoRemocao?.pagina.titulo}” será removida somente deste
                grupo. A página continuará existindo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVinculoRemocao(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={ocupado}
                onClick={remover}
              >
                {ocupado ? <Loader2 className="size-4 animate-spin" /> : null}
                Remover vínculo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
