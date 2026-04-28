"use client";

// Aba: Modalidades de retirada
// Recebe dados iniciais via props do Server Component
// Estado local apenas para toggle e edição inline

import { useState } from "react";
import { atualizarModalidade } from "@/features/admin/logistica/actions/retirada";
import type { ModalidadeRetirada } from "@/features/admin/logistica/types/logistica.types";

const iconesModalidade: Record<string, string> = {
  imediato: "⚡",
  rapido: "🚀",
  "sob-encomenda": "📦",
};

type Props = {
  modalidadesInicial: ModalidadeRetirada[];
};

export function AbaModalidades({ modalidadesInicial }: Props) {
  const [modalidades, setModalidades] = useState<ModalidadeRetirada[]>(modalidadesInicial);

  async function toggleModalidade(id: string, ativo: boolean) {
    const resultado = await atualizarModalidade(id, { ativo: !ativo });
    if (resultado.success) {
      setModalidades((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ativo: !ativo } : m))
      );
    }
  }

  return (
    <div className="space-y-6">
      {modalidades.map((mod) => (
        <div
          key={mod.id}
          className={`bg-white rounded-lg border p-6 ${
            mod.ativo ? "border-gray-200" : "border-gray-200 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{iconesModalidade[mod.slug]}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{mod.nome}</h3>
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    mod.ativo ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${mod.ativo ? "bg-green-500" : "bg-gray-300"}`} />
                  {mod.ativo ? "ativo" : "inativo"}
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleModalidade(mod.id, mod.ativo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                mod.ativo ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mod.ativo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {mod.slug === "imediato" && "Pedido dentro do horário → hoje. Fora → amanhã."}
            {mod.slug === "rapido" && "Define horário de corte para retirada no mesmo dia."}
            {mod.slug === "sob-encomenda" && "Produto precisa de prazo de produção/separação."}
          </p>

          {mod.ativo && (
            <div className="bg-gray-50 rounded-md p-4 space-y-3">
              {mod.slug === "rapido" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de corte
                  </label>
                  <input
                    type="time"
                    defaultValue={mod.config.horarioCorte || "12:00"}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pedidos até este horário retiram hoje à tarde
                  </p>
                </div>
              )}

              {mod.slug === "sob-encomenda" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prazo (dias)
                    </label>
                    <input
                      type="number"
                      min={0}
                      defaultValue={mod.config.prazoDias || 3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contagem
                    </label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`contagem-${mod.id}`}
                          defaultChecked={mod.config.tipoContagem === "uteis"}
                        />
                        Dias úteis
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`contagem-${mod.id}`}
                          defaultChecked={mod.config.tipoContagem === "corridos"}
                        />
                        Dias corridos
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm">
                <div className="font-medium text-gray-700 mb-1">Condição → Resultado</div>
                {mod.slug === "imediato" && (
                  <div className="space-y-1 text-gray-600">
                    <div>🟢 Dentro do horário → Retira hoje</div>
                    <div>🔵 Fora do horário → Retira amanhã</div>
                  </div>
                )}
                {mod.slug === "rapido" && (
                  <div className="space-y-1 text-gray-600">
                    <div>🟢 Pedido até {mod.config.horarioCorte || "12:00"} → Retira hoje (tarde)</div>
                    <div>🔵 Pedido após {mod.config.horarioCorte || "12:00"} → Retira amanhã</div>
                  </div>
                )}
                {mod.slug === "sob-encomenda" && (
                  <div className="text-gray-600">
                    📦 Sempre → Retira em {mod.config.prazoDias || 3} dias {mod.config.tipoContagem === "uteis" ? "úteis" : "corridos"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem ao cliente (opcional)
                </label>
                <input
                  type="text"
                  defaultValue={mod.mensagemPadrao || ""}
                  placeholder="Deixe vazio para usar a mensagem automática"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}