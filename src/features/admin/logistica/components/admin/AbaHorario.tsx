"use client";

// Aba: Horário da loja
// Recebe dados iniciais via props do Server Component
// Estado local apenas para formulário e mutações

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { configHorarioSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { salvarConfigHorario } from "@/features/admin/logistica/actions/retirada/salvarConfigHorario";
import { criarFeriado, excluirFeriado } from "@/features/admin/logistica/actions/retirada";
import type { ConfigHorario, Feriado } from "@/features/admin/logistica/types/logistica.types";

const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

type Props = {
  configInicial: ConfigHorario | null;
  feriadosInicial: Feriado[];
};

export function AbaHorario({ configInicial, feriadosInicial }: Props) {
  const [feriados, setFeriados] = useState<Feriado[]>(feriadosInicial);
  const [mensagem, setMensagem] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(configHorarioSchema),
    defaultValues: configInicial
      ? {
          horaAbertura: configInicial.horaAbertura,
          horaFechamento: configInicial.horaFechamento,
          usaIntervaloAlmoco: configInicial.usaIntervaloAlmoco,
          horaAlmocoInicio: configInicial.horaAlmocoInicio,
          horaAlmocoFim: configInicial.horaAlmocoFim,
          diasFuncionamento: configInicial.diasFuncionamento as unknown as ("Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sáb" | "Dom")[],
        }
      : {
          horaAbertura: "08:00",
          horaFechamento: "18:00",
          usaIntervaloAlmoco: false,
          horaAlmocoInicio: null,
          horaAlmocoFim: null,
          diasFuncionamento: ["Seg", "Ter", "Qua", "Qui", "Sex"],
        },
  });

  const usaAlmoco = watch("usaIntervaloAlmoco");

  async function onSubmit(dados: any) {
    const resultado = await salvarConfigHorario(dados);
    if (resultado.success) {
      setMensagem("Configuração salva com sucesso!");
      setTimeout(() => setMensagem(""), 3000);
    } else {
      setMensagem(resultado.error || "Erro ao salvar");
    }
  }

  async function adicionarFeriado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = (form.elements.namedItem("data") as HTMLInputElement).value;
    const descricao = (form.elements.namedItem("descricao") as HTMLInputElement).value;

    const resultado = await criarFeriado({ data, descricao });
    if (resultado.success) {
      setFeriados((prev) => [
        ...prev,
        { id: crypto.randomUUID(), data, descricao, createdAt: new Date(), updatedAt: new Date() },
      ]);
      form.reset();
    }
  }

  async function removerFeriado(id: string) {
    const resultado = await excluirFeriado(id);
    if (resultado.success) {
      setFeriados((prev) => prev.filter((f) => f.id !== id));
    }
  }

  return (
    <div className="space-y-8">
      {/* Card: Horário da loja */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🏪 Horário da loja
          </h2>
          <p className="text-sm text-gray-500">Base de cálculo para todas as modalidades</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abre</label>
              <input
                type="time"
                {...register("horaAbertura")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.horaAbertura && (
                <p className="text-red-500 text-xs mt-1">{errors.horaAbertura.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="time"
                {...register("horaFechamento")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.horaFechamento && (
                <p className="text-red-500 text-xs mt-1">{errors.horaFechamento.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="usaAlmoco"
              {...register("usaIntervaloAlmoco")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="usaAlmoco" className="text-sm font-medium text-gray-700">
              Intervalo de almoço
            </label>
            <span className="text-xs text-gray-500">Cliente não pode retirar neste período</span>
          </div>

          {usaAlmoco && (
            <div className="grid grid-cols-2 gap-4 max-w-md ml-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                <input
                  type="time"
                  {...register("horaAlmocoInicio")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                <input
                  type="time"
                  {...register("horaAlmocoFim")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dias de funcionamento</label>
            <div className="flex gap-2">
              {diasSemana.map((dia) => (
                <label
                  key={dia}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-medium cursor-pointer transition-colors
                    ${watch("diasFuncionamento")?.includes(dia)
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-gray-300 text-gray-500 hover:bg-gray-50"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    value={dia}
                    {...register("diasFuncionamento")}
                    className="sr-only"
                  />
                  {dia}
                </label>
              ))}
            </div>
            {errors.diasFuncionamento && (
              <p className="text-red-500 text-xs mt-1">{errors.diasFuncionamento.message}</p>
            )}
          </div>

          {mensagem && (
            <p className={`text-sm ${mensagem.includes("sucesso") ? "text-green-600" : "text-red-600"}`}>
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </div>

      {/* Card: Feriados */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Feriados e fechamentos especiais</h2>

        <div className="space-y-2 mb-4">
          {feriados.map((feriado) => (
            <div
              key={feriado.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
            >
              <span className="text-sm text-gray-700">
                {feriado.data} — {feriado.descricao}
              </span>
              <button
                onClick={() => removerFeriado(feriado.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
          ))}
          {feriados.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum feriado cadastrado</p>
          )}
        </div>

        <form onSubmit={adicionarFeriado} className="flex gap-2">
          <input
            name="data"
            type="date"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="descricao"
            type="text"
            placeholder="Descrição"
            required
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900"
          >
            + Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}