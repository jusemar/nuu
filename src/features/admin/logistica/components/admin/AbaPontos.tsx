"use client";

// Aba: Pontos de coleta
// Recebe dados iniciais via props
// Estado local para lista, modal e formulário

import { useState } from "react";
import { excluirPontoColeta } from "@/features/admin/logistica/actions/retirada";
import { FormPontoColeta } from "./FormPontoColeta";
import type { PontoColeta } from "@/features/admin/logistica/types/logistica.types";

type Props = {
  pontosInicial: PontoColeta[];
};

export function AbaPontos({ pontosInicial }: Props) {
  const [pontos, setPontos] = useState<PontoColeta[]>(pontosInicial);
  const [modalAberto, setModalAberto] = useState(false);
  const [pontoEditando, setPontoEditando] = useState<PontoColeta | null>(null);

  async function handleExcluir(id: string) {
    if (!confirm("Deseja realmente desativar este ponto?")) return;
    const resultado = await excluirPontoColeta(id);
    if (resultado.success) {
      setPontos((prev) => prev.filter((p) => p.id !== id));
    }
  }

  function handleEditar(ponto: PontoColeta) {
    setPontoEditando(ponto);
    setModalAberto(true);
  }

  function handleNovo() {
    setPontoEditando(null);
    setModalAberto(true);
  }

  function handleSalvar(ponto: PontoColeta) {
    if (pontoEditando) {
      setPontos((prev) => prev.map((p) => (p.id === ponto.id ? ponto : p)));
    } else {
      setPontos((prev) => [...prev, ponto]);
    }
    setModalAberto(false);
    setPontoEditando(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleNovo}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Novo ponto
        </button>
      </div>

      {pontos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum ponto de coleta cadastrado
        </div>
      )}

      {pontos.map((ponto) => (
        <div
          key={ponto.id}
          className={`bg-white rounded-lg border p-6 ${
            ponto.ativo ? "border-gray-200" : "border-gray-200 opacity-60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{ponto.nome}</h3>
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      ponto.ativo ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${ponto.ativo ? "bg-green-500" : "bg-gray-300"}`} />
                    {ponto.ativo ? "ativo" : "inativo"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{ponto.endereco}</p>
                <p className="text-sm text-gray-500">
                  {ponto.cidade} / {ponto.estado} · {ponto.cep}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  🕐 {ponto.herdaHorarioGlobal ? "Herda horário global da loja" : "Horário próprio"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditar(ponto)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Editar
              </button>
              <button
                onClick={() => handleExcluir(ponto.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Desativar
              </button>
            </div>
          </div>
        </div>
      ))}

      {modalAberto && (
        <FormPontoColeta
          ponto={pontoEditando}
          onSalvar={handleSalvar}
          onFechar={() => {
            setModalAberto(false);
            setPontoEditando(null);
          }}
        />
      )}
    </div>
  );
}