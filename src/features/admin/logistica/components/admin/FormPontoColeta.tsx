"use client";

// Modal/Form para criar ou editar ponto de coleta
// Usa react-hook-form + zod
// Chama Server Actions para mutação

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { criarPontoColetaSchema } from "@/features/admin/logistica/schemas/retiradaLocal.schema";
import { criarPontoColeta, atualizarPontoColeta } from "@/features/admin/logistica/actions/retirada";
import type { PontoColeta } from "@/features/admin/logistica/types/logistica.types";
type Props = {
  ponto: PontoColeta | null;
  onSalvar: (ponto: PontoColeta) => void;
  onFechar: () => void;
};

export function FormPontoColeta({ ponto, onSalvar, onFechar }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({
    resolver: zodResolver(criarPontoColetaSchema),
    defaultValues: {
      nome: "",
      slug: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      ativo: true,
      herdaHorarioGlobal: true,
    },
  });

  useEffect(() => {
    if (ponto) {
      setValue("nome", ponto.nome);
      setValue("slug", ponto.slug);
      setValue("endereco", ponto.endereco);
      setValue("cidade", ponto.cidade);
      setValue("estado", ponto.estado);
      setValue("cep", ponto.cep);
      setValue("ativo", ponto.ativo);
      setValue("herdaHorarioGlobal", ponto.herdaHorarioGlobal);
    }
  }, [ponto, setValue]);

  async function onSubmit(dados: any) {
    if (ponto) {
      const resultado = await atualizarPontoColeta(ponto.id, dados);
      if (resultado.success) {
        onSalvar({ ...ponto, ...dados });
      }
    } else {
      const resultado = await criarPontoColeta(dados);
      if (resultado.success) {
        // Cria objeto temporário com ID gerado
        const novoPonto: PontoColeta = {
          ...dados,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        onSalvar(novoPonto);
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {ponto ? "Editar ponto de coleta" : "Novo ponto de coleta"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              {...register("nome")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex: Loja Centro"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <input
              {...register("slug")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="loja-centro"
            />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              {...register("endereco")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Rua, número — bairro"
            />
            {errors.endereco && <p className="text-red-500 text-xs mt-1">{errors.endereco.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                {...register("cidade")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.cidade && <p className="text-red-500 text-xs mt-1">{errors.cidade.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                {...register("estado")}
                maxLength={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
                placeholder="MG"
              />
              {errors.estado && <p className="text-red-500 text-xs mt-1">{errors.estado.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                {...register("cep")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="00000-000"
              />
              {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="herdaHorario"
              {...register("herdaHorarioGlobal")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="herdaHorario" className="text-sm text-gray-700">
              Herda horário global da loja
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              {...register("ativo")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="ativo" className="text-sm text-gray-700">
              Ponto ativo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}