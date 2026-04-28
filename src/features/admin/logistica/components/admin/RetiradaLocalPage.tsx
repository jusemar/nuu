"use client";

// Página principal de Retirada Local — Admin
// Recebe dados iniciais via props do Server Component (page.tsx)
// Estado local apenas para UI (aba ativa), não para dados

import { useState } from "react";
import { AbaHorario } from "./AbaHorario";
import { AbaModalidades } from "./AbaModalidades";
import { AbaPontos } from "./AbaPontos";
import type { ConfigHorario, Feriado, ModalidadeRetirada, PontoColeta } from "@/features/admin/logistica/types/logistica.types";

type Aba = "horario" | "modalidades" | "pontos";

const abas: { id: Aba; label: string }[] = [
  { id: "horario", label: "Horário" },
  { id: "modalidades", label: "Modalidades" },
  { id: "pontos", label: "Pontos" },
];

type Props = {
  configInicial: ConfigHorario | null;
  feriadosInicial: Feriado[];
  modalidadesInicial: ModalidadeRetirada[];
  pontosInicial: PontoColeta[];
};

export function RetiradaLocalPage({
  configInicial,
  feriadosInicial,
  modalidadesInicial,
  pontosInicial,
}: Props) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("horario");

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retirada Local</h1>
          <p className="text-sm text-gray-500 mt-1">
            Horário, modalidades e pontos de coleta
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`
                py-4 px-1 text-sm font-medium border-b-2 transition-colors
                ${
                  abaAtiva === aba.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da aba */}
      <div className="mt-6">
        {abaAtiva === "horario" && (
          <AbaHorario configInicial={configInicial} feriadosInicial={feriadosInicial} />
        )}
        {abaAtiva === "modalidades" && (
          <AbaModalidades modalidadesInicial={modalidadesInicial} />
        )}
        {abaAtiva === "pontos" && (
          <AbaPontos pontosInicial={pontosInicial} />
        )}
      </div>
    </div>
  );
}