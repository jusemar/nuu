"use client";

// Página de configuração de Retirada Local — Admin
// Recebe modelos via props do Server Component
// CRUD completo: criar, editar, excluir modelos

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { criarModeloRetirada, atualizarModeloRetirada, excluirModeloRetirada } from "@/features/admin/logistica/actions/retirada";
import { modeloRetiradaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import type { ModeloRetirada } from "@/features/admin/logistica/types/logistica.types";

type Props = {
  modelosInicial: ModeloRetirada[];
};

const formVazio = {
  nome: "",
  prazoTexto: "",
  mensagem: "",
  ativo: true,
};

export function ConfigRetiradaLocalPage({ modelosInicial }: Props) {
  const [modelos, setModelos] = useState<ModeloRetirada[]>(modelosInicial);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
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

  async function onSubmit(dados: any) {
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
        // Recarrega a página para buscar o novo modelo com ID gerado pelo banco
        window.location.reload();
      } else {
        setErro(resultado.error || "Erro ao criar");
      }
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
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retirada Local</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crie modelos de retirada que serão exibidos na página do produto.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Novo modelo
        </button>
      </div>

      {/* Explicação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-1">📋 Como usar</h3>
        <p className="text-sm text-blue-700">
          Crie modelos com nome, prazo e mensagem. O cliente verá essas informações na página do produto.
        </p>
        <div className="bg-white rounded-md p-3 mt-3 text-xs text-blue-800">
          <p className="font-medium mb-1">Exemplos:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Retirada na loja:</strong> "Hoje, no horário comercial" — Produto disponível em estoque.</li>
            <li><strong>Retirada expressa:</strong> "Pedido até 12h → retira após 15h" — Separação prioritária.</li>
            <li><strong>Retirada sob encomenda:</strong> "3 a 7 dias úteis" — Produto sob encomenda do fornecedor.</li>
          </ul>
        </div>
      </div>

      {/* Lista de modelos */}
      {modelos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
          <p className="text-lg mb-2">Nenhum modelo cadastrado</p>
          <p className="text-sm">Clique em "+ Novo modelo" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modelos.map((modelo) => (
            <div
              key={modelo.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{modelo.nome}</h3>
                    {modelo.ativo ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                        ativo
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        inativo
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-2">
                    ⏱ {modelo.prazoTexto}
                  </span>
                  {modelo.mensagem && (
                    <p className="text-sm text-gray-500 italic mt-2">"{modelo.mensagem}"</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => abrirEditar(modelo)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluir(modelo.id)}
                    className="text-sm px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editandoId ? "Editar modelo" : "Novo modelo"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do modelo
                </label>
                <input
                  {...register("nome")}
                  placeholder="Ex: Retirada na loja"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.nome && (
                  <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo exibido ao cliente
                </label>
                <input
                  {...register("prazoTexto")}
                  placeholder="Ex: Hoje, no horário comercial"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.prazoTexto && (
                  <p className="text-red-500 text-xs mt-1">{errors.prazoTexto.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem ao cliente (opcional)
                </label>
                <textarea
                  {...register("mensagem")}
                  rows={3}
                  placeholder="Ex: Endereço enviado após pagamento via WhatsApp."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
                />
              </div>

              {erro && <p className="text-sm text-red-600">{erro}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={fechar}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}