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
import { FileText, Layers3, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

import { alterarAtivacaoGrupoNavegacao } from "../../actions/grupos";
import { reordenarGruposNavegacao } from "../../actions/vinculos-e-ordenacao";
import type { GrupoNavegacaoComPaginas } from "../../types/paginas-dinamicas.types";
import {
  FormularioGrupoNavegacao,
  type GrupoEmEdicao,
} from "./formulario-grupo-navegacao";
import { GerenciadorPaginasGrupo } from "./gerenciador-paginas-grupo";
import { ItemGrupoNavegacao } from "./item-grupo-navegacao";

type Propriedades = {
  gruposIniciais: GrupoNavegacaoComPaginas[];
  paginas: PaginaDinamica[];
  incorporada?: boolean;
};

function dadosEdicao(grupo: GrupoNavegacaoComPaginas): GrupoEmEdicao {
  return {
    id: grupo.id,
    nome: grupo.nome,
    tituloPublico: grupo.tituloPublico,
    identificador: grupo.identificador,
    localExibicao: grupo.localExibicao,
    ativo: grupo.ativo,
    ordem: grupo.ordem,
  };
}

export function PaginaGruposNavegacao({
  gruposIniciais,
  paginas,
  incorporada = false,
}: Propriedades) {
  const router = useRouter();
  const [grupos, setGrupos] = useState(gruposIniciais);
  const [grupoPaginas, setGrupoPaginas] =
    useState<GrupoNavegacaoComPaginas | null>(null);
  const [grupoEdicao, setGrupoEdicao] =
    useState<GrupoNavegacaoComPaginas | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [chaveFormulario, setChaveFormulario] = useState(0);
  const [confirmarDesativacao, setConfirmarDesativacao] =
    useState<GrupoNavegacaoComPaginas | null>(null);
  const [ocupado, iniciarTransicao] = useTransition();
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function abrirNovo() {
    setGrupoEdicao(null);
    setChaveFormulario((valor) => valor + 1);
    setFormularioAberto(true);
  }

  function abrirEdicao(grupo: GrupoNavegacaoComPaginas) {
    setGrupoEdicao(grupo);
    setChaveFormulario((valor) => valor + 1);
    setFormularioAberto(true);
  }

  function grupoSalvo(dados: GrupoEmEdicao) {
    const existente = grupos.find((grupo) => grupo.id === dados.id);
    if (existente) {
      setGrupos((atuais) =>
        atuais.map((grupo) =>
          grupo.id === dados.id
            ? { ...grupo, ...dados, updatedAt: new Date() }
            : grupo,
        ),
      );
    } else {
      const agora = new Date();
      setGrupos((atuais) => [
        ...atuais,
        { ...dados, createdAt: agora, updatedAt: agora, paginas: [] },
      ]);
    }
    router.refresh();
  }

  function persistirOrdem(
    ordenados: GrupoNavegacaoComPaginas[],
    anteriores: GrupoNavegacaoComPaginas[],
  ) {
    setGrupos(ordenados.map((grupo, ordem) => ({ ...grupo, ordem })));
    iniciarTransicao(async () => {
      const resultado = await reordenarGruposNavegacao({
        localExibicao: "rodape",
        idsOrdenados: ordenados.map((grupo) => grupo.id),
      });
      if (!resultado.sucesso) {
        setGrupos(anteriores);
        toast.error(resultado.mensagem);
        return;
      }
      toast.success("Ordem dos grupos salva.");
      router.refresh();
    });
  }

  function moverGrupo(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= grupos.length) return;
    persistirOrdem(arrayMove(grupos, indice, destino), grupos);
  }

  function finalizarArraste(evento: DragEndEvent) {
    if (!evento.over || evento.active.id === evento.over.id) return;
    const origem = grupos.findIndex((grupo) => grupo.id === evento.active.id);
    const destino = grupos.findIndex((grupo) => grupo.id === evento.over?.id);
    if (origem < 0 || destino < 0) return;
    persistirOrdem(arrayMove(grupos, origem, destino), grupos);
  }

  function alterarAtivacao(grupo: GrupoNavegacaoComPaginas, ativo: boolean) {
    iniciarTransicao(async () => {
      const resultado = await alterarAtivacaoGrupoNavegacao({
        id: grupo.id,
        ativo,
      });
      if (!resultado.sucesso) {
        toast.error(resultado.mensagem);
        return;
      }
      setGrupos((atuais) =>
        atuais.map((item) =>
          item.id === grupo.id
            ? { ...item, ativo, updatedAt: new Date() }
            : item,
        ),
      );
      setConfirmarDesativacao(null);
      toast.success(ativo ? "Grupo ativado." : "Grupo desativado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {!incorporada && (
            <p className="text-primary text-sm font-medium">Configurações</p>
          )}
          <h2
            className={
              incorporada
                ? "text-lg font-semibold"
                : "text-2xl font-bold tracking-tight sm:text-3xl"
            }
          >
            {incorporada ? "Grupos de navegação" : "Páginas da loja"}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Organize os grupos que receberão páginas institucionais no rodapé.
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="size-4" />
          Novo grupo
        </Button>
      </header>

      <Card className="border-primary/15 bg-primary/5">
        <CardContent className="flex gap-3 p-4">
          <Layers3 className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Grupos de navegação</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Arraste para definir a ordem no rodapé. O vínculo de páginas será
              disponibilizado em uma próxima etapa.
            </p>
          </div>
        </CardContent>
      </Card>

      {grupos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground size-6" />
            </div>
            <h2 className="font-semibold">Nenhum grupo criado</h2>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              Crie o primeiro grupo para preparar a organização das páginas
              institucionais.
            </p>
            <Button className="mt-5" onClick={abrirNovo}>
              <Plus className="size-4" />
              Criar primeiro grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensores}
          collisionDetection={closestCenter}
          onDragEnd={finalizarArraste}
        >
          <SortableContext
            items={grupos.map((grupo) => grupo.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3" aria-busy={ocupado}>
              {grupos.map((grupo, indice) => (
                <ItemGrupoNavegacao
                  key={grupo.id}
                  grupo={grupo}
                  indice={indice}
                  total={grupos.length}
                  ocupado={ocupado}
                  aoEditar={() => abrirEdicao(grupo)}
                  aoGerenciarPaginas={() => setGrupoPaginas(grupo)}
                  aoMover={(direcao) => moverGrupo(indice, direcao)}
                  aoAlterarAtivacao={() =>
                    grupo.ativo
                      ? setConfirmarDesativacao(grupo)
                      : alterarAtivacao(grupo, true)
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FormularioGrupoNavegacao
        key={chaveFormulario}
        aberto={formularioAberto}
        grupo={grupoEdicao ? dadosEdicao(grupoEdicao) : null}
        proximaOrdem={grupos.length}
        aoAlterarAbertura={setFormularioAberto}
        aoSalvar={grupoSalvo}
      />

      <GerenciadorPaginasGrupo
        key={grupoPaginas?.id ?? "sem-grupo"}
        aberto={Boolean(grupoPaginas)}
        grupo={grupoPaginas}
        paginas={paginas}
        aoAlterarAbertura={(aberto) => !aberto && setGrupoPaginas(null)}
        aoAlterarVinculos={(grupoId, vinculos) => {
          setGrupos((atuais) =>
            atuais.map((grupo) =>
              grupo.id === grupoId ? { ...grupo, paginas: vinculos } : grupo,
            ),
          );
          setGrupoPaginas((atual) =>
            atual?.id === grupoId ? { ...atual, paginas: vinculos } : atual,
          );
        }}
      />

      <Dialog
        open={Boolean(confirmarDesativacao)}
        onOpenChange={(aberto) => !aberto && setConfirmarDesativacao(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar grupo?</DialogTitle>
            <DialogDescription>
              O grupo “{confirmarDesativacao?.nome}” deixará de estar disponível
              para exibição futura. As páginas vinculadas serão preservadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmarDesativacao(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={ocupado}
              onClick={() =>
                confirmarDesativacao &&
                alterarAtivacao(confirmarDesativacao, false)
              }
            >
              {ocupado ? <Loader2 className="size-4 animate-spin" /> : null}
              Desativar grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
