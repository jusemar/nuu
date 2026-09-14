"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ModoDisponibilidadeFreteExterno } from "@/features/logistica/types/disponibilidade-frete-externo";

const DESCRICOES: Record<ModoDisponibilidadeFreteExterno, string> = {
  herdar: "Usa a configuração superior",
  ativado: "Participa das regras logísticas",
  desativado: "Não oferece frete externo",
};

/** Escolha Herdar / Ativado / Desativado, responsiva (empilha no mobile). */
export function SeletorModoFreteExterno({
  id,
  valor,
  rotuloHerdar,
  desabilitado = false,
  descricoes = DESCRICOES,
  rotuloGrupo = "Disponibilidade do Frete Externo",
  aoAlterar,
}: {
  id: string;
  valor: ModoDisponibilidadeFreteExterno;
  rotuloHerdar: string;
  desabilitado?: boolean;
  /** Textos de apoio de cada opção (reutilizado pela Entrega Própria). */
  descricoes?: Record<ModoDisponibilidadeFreteExterno, string>;
  rotuloGrupo?: string;
  aoAlterar: (modo: ModoDisponibilidadeFreteExterno) => void;
}) {
  const opcoes: Array<{
    modo: ModoDisponibilidadeFreteExterno;
    rotulo: string;
  }> = [
    { modo: "herdar", rotulo: rotuloHerdar },
    { modo: "ativado", rotulo: "Ativado" },
    { modo: "desativado", rotulo: "Desativado" },
  ];

  return (
    <RadioGroup
      value={valor}
      onValueChange={(modo) =>
        aoAlterar(modo as ModoDisponibilidadeFreteExterno)
      }
      disabled={desabilitado}
      className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      aria-label={rotuloGrupo}
    >
      {opcoes.map(({ modo, rotulo }) => (
        <Label
          key={modo}
          htmlFor={`${id}-${modo}`}
          className="has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3"
        >
          <RadioGroupItem
            id={`${id}-${modo}`}
            value={modo}
            className="mt-0.5"
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium text-gray-900">
              {rotulo}
            </span>
            <span className="block text-xs font-normal text-gray-500">
              {descricoes[modo]}
            </span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  );
}
