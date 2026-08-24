"use client";

import { Archive, FileText, Loader2, Pencil, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaginaDinamica } from "@/db/schema";

import { arquivarPaginaDinamica } from "../../actions/paginas";
import { conteudoPaginaDinamicaSchema } from "../../schemas/conteudo-pagina-dinamica.schema";
import {
  FormularioPaginaDinamica,
  type PaginaEmEdicao,
} from "./formulario-pagina-dinamica";

type Propriedades = { paginasIniciais: PaginaDinamica[] };
type FiltroStatus = "todas" | "rascunho" | "publicada" | "arquivada";

const rotulosStatus = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  arquivada: "Arquivada",
} as const;

function prepararEdicao(pagina: PaginaDinamica): PaginaEmEdicao | null {
  if (pagina.status === "arquivada") return null;
  const conteudo = conteudoPaginaDinamicaSchema.safeParse(pagina.conteudo);
  if (!conteudo.success) return null;
  return {
    id: pagina.id,
    titulo: pagina.titulo,
    slug: pagina.slug,
    conteudo: conteudo.data,
    status: pagina.status,
    tituloSeo: pagina.tituloSeo,
    descricaoSeo: pagina.descricaoSeo,
    publicadaEm: pagina.publicadaEm,
  };
}

export function PaginaPaginasDinamicas({ paginasIniciais }: Propriedades) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("todas");
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [paginaEdicao, setPaginaEdicao] = useState<PaginaEmEdicao | null>(null);
  const [chaveFormulario, setChaveFormulario] = useState(0);
  const [paginaArquivo, setPaginaArquivo] = useState<PaginaDinamica | null>(
    null,
  );
  const [ocupado, iniciarTransicao] = useTransition();

  const paginas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return paginasIniciais.filter(
      (pagina) =>
        (status === "todas" || pagina.status === status) &&
        (!termo ||
          pagina.titulo.toLocaleLowerCase("pt-BR").includes(termo) ||
          pagina.slug.toLocaleLowerCase("pt-BR").includes(termo)),
    );
  }, [busca, paginasIniciais, status]);

  function abrirNova() {
    setPaginaEdicao(null);
    setChaveFormulario((atual) => atual + 1);
    setFormularioAberto(true);
  }

  function abrirEdicao(pagina: PaginaDinamica) {
    const dados = prepararEdicao(pagina);
    if (!dados) {
      toast.error("O conteúdo desta página não pode ser editado neste editor.");
      return;
    }
    setPaginaEdicao(dados);
    setChaveFormulario((atual) => atual + 1);
    setFormularioAberto(true);
  }

  function arquivar() {
    if (!paginaArquivo) return;
    iniciarTransicao(async () => {
      const resultado = await arquivarPaginaDinamica({ id: paginaArquivo.id });
      if (!resultado.sucesso) {
        toast.error(resultado.mensagem);
        return;
      }
      setPaginaArquivo(null);
      toast.success("Página arquivada.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Páginas institucionais</h2>
          <p className="text-muted-foreground text-sm">
            Crie e prepare conteúdos da loja. Nenhuma rota pública é criada
            aqui.
          </p>
        </div>
        <Button onClick={abrirNova}>
          <Plus className="size-4" />
          Nova página
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por título ou slug"
            className="pl-9"
            aria-label="Buscar páginas"
          />
        </div>
        <Select
          value={status}
          onValueChange={(valor) => setStatus(valor as FiltroStatus)}
        >
          <SelectTrigger aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="publicada">Publicada</SelectItem>
            <SelectItem value="arquivada">Arquivada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paginas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileText className="text-muted-foreground mb-3 size-8" />
            <h3 className="font-medium">Nenhuma página encontrada</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {paginasIniciais.length
                ? "Ajuste a busca ou o filtro."
                : "Crie a primeira página institucional."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginas.map((pagina) => (
            <Card key={pagina.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-medium">{pagina.titulo}</h3>
                    <Badge
                      variant={
                        pagina.status === "publicada" ? "default" : "secondary"
                      }
                    >
                      {rotulosStatus[pagina.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate font-mono text-xs">
                    /{pagina.slug}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Atualizada em{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(pagina.updatedAt)}
                  </p>
                </div>
                {pagina.status !== "arquivada" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirEdicao(pagina)}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaArquivo(pagina)}
                    >
                      <Archive className="size-4" />
                      Arquivar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormularioPaginaDinamica
        key={chaveFormulario}
        aberto={formularioAberto}
        pagina={paginaEdicao}
        aoAlterarAbertura={setFormularioAberto}
        aoSalvar={() => router.refresh()}
      />
      <Dialog
        open={Boolean(paginaArquivo)}
        onOpenChange={(aberto) => !aberto && setPaginaArquivo(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar página?</DialogTitle>
            <DialogDescription>
              “{paginaArquivo?.titulo}” deixará de ser considerada publicada. Os
              dados serão preservados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaginaArquivo(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={ocupado} onClick={arquivar}>
              {ocupado && <Loader2 className="size-4 animate-spin" />}Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
