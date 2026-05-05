// TODO: Implementar
"use client";

// Seção de Retirada Local na página do produto (admin)
// Permite escolher modelo e personalizar prazo

import { useState } from "react";
import { buscarModelosRetirada } from "@/features/admin/logistica/queries/retirada";
import type { ModeloRetirada } from "@/features/admin/logistica/types/logistica.types";

type Props = {
  modelos: ModeloRetirada[];
  habilitado?: boolean;
  modeloId?: string | null;
  prazoCustom?: string;
  onChange?: (dados: {
    habilitado: boolean;
    modeloId: string | null;
    prazoCustom: string;
  }) => void;
};

export function SecaoRetiradaProduto({
  modelos,
  habilitado = false,
  modeloId = null,
  prazoCustom = "",
  onChange,
}: Props) {
  const [ativo, setAtivo] = useState(habilitado);
  const [selecionado, setSelecionado] = useState<string | null>(modeloId);
  const [custom, setCustom] = useState(prazoCustom);

  const modelo = modelos.find((m) => m.id === selecionado);
  const prazoFinal = custom.trim() || modelo?.prazoTexto || "";

  function update(patch: Partial<{ habilitado: boolean; modeloId: string | null; prazoCustom: string }>) {
    const novo = {
      habilitado: patch.habilitado ?? ativo,
      modeloId: patch.modeloId !== undefined ? patch.modeloId : selecionado,
      prazoCustom: patch.prazoCustom !== undefined ? patch.prazoCustom : custom,
    };
    onChange?.(novo);
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Retirada local</h3>
          <p className="text-xs text-gray-400 mt-0.5">Configuração para este produto.</p>
        </div>
        <button
          onClick={() => {
            setAtivo(!ativo);
            update({ habilitado: !ativo });
          }}
          className={`relative w-10 h-5 rounded-full transition-colors ${ativo ? "bg-blue-600" : "bg-gray-200"}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              ativo ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {ativo && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1.5">
              Modelo de retirada
            </label>
            {modelos.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Nenhum modelo cadastrado. Acesse Logística › Retirada local para criar.
              </p>
            ) : (
              <select
                value={selecionado ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSelecionado(id);
                  update({ modeloId: id, prazoCustom: "" });
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
              >
                <option value="">— Selecione um modelo —</option>
                {modelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          {modelo && (
            <>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1.5">
                  Prazo personalizado <span className="normal-case text-gray-400">(opcional)</span>
                </label>
                <input
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    update({ prazoCustom: e.target.value });
                  }}
                  placeholder={modelo.prazoTexto}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Deixe vazio para usar o prazo padrão do modelo.
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Como o cliente vê
                </p>
                <div className="flex items-center gap-2 p-2.5 border-[1.5px] border-gray-200 rounded-lg bg-white">
                  <div className="flex-1 text-xs font-semibold text-gray-900">
                    {modelo.nome}
                  </div>
                  <div className="text-[11px] text-gray-500 text-right">
                    {prazoFinal}
                  </div>
                  <div className="text-xs font-bold text-green-600">
                    Grátis
                  </div>
                </div>
                {modelo.mensagem && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-light text-success ml-1">
                    {modelo.mensagem}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}