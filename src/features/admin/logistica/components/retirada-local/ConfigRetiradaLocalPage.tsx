"use client";

// Página de configuração de Retirada Local — Admin
// Recebe modelos via props do Server Component
// CRUD completo: criar, editar, excluir modelos

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Package, Plus, Store, Trash2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { criarModeloRetirada, atualizarModeloRetirada, excluirModeloRetirada } from "@/features/admin/logistica/actions/retirada";
import { modeloRetiradaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import type { ModeloRetirada } from "@/features/admin/logistica/types/logistica.types";

type Props = {
  modelosInicial: ModeloRetirada[];
};

const formVazio = {
  nome: "",
  prazoTexto: "",
  mensagem: undefined as string | undefined,
  ativo: true,
};

type FormData = {
  nome: string;
  prazoTexto: string;
  mensagem?: string | null;
  ativo: boolean;
};

export function ConfigRetiradaLocalPage({ modelosInicial }: Props) {
  const [modelos, setModelos] = useState<ModeloRetirada[]>(modelosInicial);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(modeloRetiradaSchema),
    defaultValues: formVazio,
  });

  function abrirNovo() {
    setEditandoId(null);
    reset(formVazio);
    setErro("");
    setModalAberto(true);
  }

  function abrirEditar(modelo: ModeloRetirada) {
    setEditandoId(modelo.id);
    reset({
      nome: modelo.nome,
      prazoTexto: modelo.prazoTexto,
      mensagem: modelo.mensagem || "",
      ativo: modelo.ativo,
    });
    setErro("");
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEditandoId(null);
    reset(formVazio);
    setErro("");
  }

  async function onSubmit(dados: FormData) {
    setIsLoading(true);
    try {
      if (editandoId) {
        const resultado = await atualizarModeloRetirada(editandoId, dados);
        if (resultado.success) {
          setModelos((prev) =>
            prev.map((m) => (m.id === editandoId ? { ...m, ...dados } : m))
          );
          fechar();
        } else {
          setErro(resultado.error || "Erro ao atualizar");
        }
      } else {
        const resultado = await criarModeloRetirada(dados);
        if (resultado.success) {
          window.location.reload();
        } else {
          setErro(resultado.error || "Erro ao criar");
        }
      }
    } catch {
      setErro("Erro interno. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm("Deseja realmente excluir este modelo?")) return;
    const resultado = await excluirModeloRetirada(id);
    if (resultado.success) {
      setModelos((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-6 h-6" />
            Retirada Local
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie modelos de retirada que serão exibidos na página do produto.
          </p>
        </div>
        <Button onClick={abrirNovo} size="sm">
          <Plus className="w-4 h-4" />
          Novo modelo
        </Button>
      </div>

      {/* Explicação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Como usar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Crie modelos com nome, prazo e mensagem. O cliente verá essas informações na página do produto.
          </p>
          <div className="bg-muted rounded-md p-3 space-y-2">
            <p className="font-medium text-foreground">Exemplos:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Retirada na loja:</strong> "Hoje, no horário comercial" — Produto disponível em estoque.
              </li>
              <li>
                <strong className="text-foreground">Retirada expressa:</strong> "Pedido até 12h → retira após 15h" — Separação prioritária.
              </li>
              <li>
                <strong className="text-foreground">Retirada sob encomenda:</strong> "3 a 7 dias úteis" — Produto sob encomenda do fornecedor.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Lista de modelos */}
      {modelos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <Package className="w-12 h-12 text-muted-foreground/50" />
            <div>
              <p className="text-lg font-medium text-foreground">Nenhum modelo cadastrado</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo modelo" para começar</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {modelos.map((modelo) => (
            <Card key={modelo.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{modelo.nome}</h3>
                    <Badge variant={modelo.ativo ? "default" : "secondary"}>
                      {modelo.ativo ? "ativo" : "inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">{modelo.prazoTexto}</span>
                  </div>
                  {modelo.mensagem && (
                    <p className="text-sm text-muted-foreground italic">"{modelo.mensagem}"</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => abrirEditar(modelo)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExcluir(modelo.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalAberto} onOpenChange={(open) => !open && fechar()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar modelo" : "Novo modelo"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do modelo de retirada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do modelo</label>
              <Input
                {...register("nome")}
                placeholder="Ex: Retirada na loja"
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prazo exibido ao cliente</label>
              <Input
                {...register("prazoTexto")}
                placeholder="Ex: Hoje, no horário comercial"
              />
              {errors.prazoTexto && (
                <p className="text-sm text-destructive">{errors.prazoTexto.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem ao cliente (opcional)</label>
              <Textarea
                {...register("mensagem")}
                rows={3}
                placeholder="Ex: Endereço enviado após pagamento via WhatsApp."
              />
            </div>

            {erro && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{erro}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={fechar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}