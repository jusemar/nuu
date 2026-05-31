"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  alternarAtivoMarca,
  criarMarca,
  editarMarca,
  excluirMarca,
  listarMarcas,
} from "@/features/admin/marcas/services/marcaService";

type MarcaLista = Awaited<ReturnType<typeof listarMarcas>>[number];

export default function PaginaAdminMarcas() {
  const cardFormularioRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [modoEdicaoId, setModoEdicaoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState({
    nome: "",
    descricao: "",
    logoUrl: "",
  });

  const { data: marcas = [], isLoading } = useQuery({
    queryKey: ["marcas-admin"],
    queryFn: listarMarcas,
  });

  const marcasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return marcas;
    return marcas.filter((m) => m.nome.toLowerCase().includes(termo));
  }, [busca, marcas]);

  const recarregar = () =>
    queryClient.invalidateQueries({ queryKey: ["marcas-admin"] });

  const mutacaoCriar = useMutation({
    mutationFn: criarMarca,
    onSuccess: async () => {
      toast.success("Marca criada com sucesso.");
      setFormulario({ nome: "", descricao: "", logoUrl: "" });
      await recarregar();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao criar marca"),
  });

  const mutacaoEditar = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: typeof formulario }) =>
      editarMarca(id, dados),
    onSuccess: async () => {
      toast.success("Marca atualizada com sucesso.");
      setModoEdicaoId(null);
      setFormulario({ nome: "", descricao: "", logoUrl: "" });
      await recarregar();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar marca",
      ),
  });

  const mutacaoAtivar = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      alternarAtivoMarca(id, ativo),
    onSuccess: recarregar,
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar status",
      ),
  });

  const mutacaoExcluir = useMutation({
    mutationFn: excluirMarca,
    onSuccess: async () => {
      toast.success("Marca excluída com sucesso.");
      await recarregar();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao excluir"),
  });

  const iniciarEdicao = (marca: MarcaLista) => {
    setModoEdicaoId(marca.id);
    setFormulario({
      nome: marca.nome,
      descricao: marca.descricao ?? "",
      logoUrl: marca.logoUrl ?? "",
    });
    cardFormularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.info(`Editando marca: ${marca.nome}`);
  };

  const enviarFormulario = () => {
    if (modoEdicaoId) {
      mutacaoEditar.mutate({ id: modoEdicaoId, dados: formulario });
      return;
    }
    mutacaoCriar.mutate(formulario);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card ref={cardFormularioRef}>
        <CardHeader>
          <CardTitle>Marcas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome</Label>
            <Input
              value={formulario.nome}
              onChange={(e) => setFormulario((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Nike"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={formulario.descricao}
              onChange={(e) =>
                setFormulario((p) => ({ ...p, descricao: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={formulario.logoUrl}
              onChange={(e) =>
                setFormulario((p) => ({ ...p, logoUrl: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-4 flex items-center gap-2">
            <Button type="button" onClick={enviarFormulario}>
              {modoEdicaoId ? "Salvar edição" : "Criar marca"}
            </Button>
            {modoEdicaoId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModoEdicaoId(null);
                  setFormulario({ nome: "", descricao: "", logoUrl: "" });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar marca..."
            />
          </div>

          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <div className="space-y-2">
              {marcasFiltradas.map((marca) => (
                <div
                  key={marca.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <p className="font-medium">{marca.nome}</p>
                    <p className="text-xs text-slate-500">
                      {marca.slug} • {marca.totalProdutos} produto(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={marca.ativo}
                      disabled={marca.isPadrao}
                      onCheckedChange={(ativo) =>
                        mutacaoAtivar.mutate({ id: marca.id, ativo })
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => iniciarEdicao(marca)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={marca.isPadrao}
                      onClick={() => mutacaoExcluir.mutate(marca.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
