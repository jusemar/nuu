"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  removerAgendaPropriaParaHerdar,
  salvarAgendaGeograficaEntregaPropria,
} from "../../actions/agenda-geografica-entrega-propria.actions";
import {
  type FormularioAgendaGeograficaEntregaPropria,
  formularioAgendaGeograficaEntregaPropriaSchema,
  separarDatasBloqueadas,
} from "../../schemas/agenda-geografica-entrega-propria.schema";
import { ResumoAgendaGeograficaEmUso } from "./resumo-agenda-geografica-em-uso";
import { SeletorDiasAtendidosEntregaPropria } from "./seletor-dias-atendidos-entrega-propria";

type ItemAgenda = Awaited<
  ReturnType<
    typeof import("../../queries/agenda-geografica-entrega-propria.queries").listarAgendaGeograficaEntregaPropriaAdmin
  >
>["itens"][number];

export function EditorAgendaGeograficaEntregaPropria({
  item,
}: {
  item: ItemAgenda;
}) {
  const [isHerancaPending, startTransition] = useTransition();
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormularioAgendaGeograficaEntregaPropria>({
    resolver: zodResolver(formularioAgendaGeograficaEntregaPropriaSchema),
    // Sem agenda própria, o formulário parte da agenda herdada.
    defaultValues: {
      diasAtendidos:
        item.agendaPropria?.diasAtendidos ??
        item.agendaEfetiva?.diasAtendidos ??
        [],
      horarioCorte:
        item.agendaPropria?.horarioCorte ??
        item.agendaEfetiva?.horarioCorte ??
        "13:00",
      bloqueiosTexto: item.agendaPropria?.datasBloqueadas.join(", ") ?? "",
    },
  });
  const dias = watch("diasAtendidos");
  const idCampo = `${item.tipoDestino}-${item.destinoId}`;
  const ocupado = isHerancaPending || isSubmitting;

  function alternarDia(dia: number) {
    setValue(
      "diasAtendidos",
      dias.includes(dia)
        ? dias.filter((itemAtual) => itemAtual !== dia)
        : [...dias, dia].sort((a, b) => a - b),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  const salvar = handleSubmit(async (dados) => {
    const resultado = await salvarAgendaGeograficaEntregaPropria({
      tipoDestino: item.tipoDestino,
      destinoId: item.destinoId,
      diasAtendidos: dados.diasAtendidos,
      horarioCorte: dados.horarioCorte,
      datasBloqueadas: separarDatasBloqueadas(dados.bloqueiosTexto),
    });
    if (resultado.sucesso) toast.success("Agenda geográfica salva.");
    else toast.error(resultado.erro);
  });

  function herdar() {
    startTransition(async () => {
      const resultado = await removerAgendaPropriaParaHerdar({
        tipoDestino: item.tipoDestino,
        destinoId: item.destinoId,
      });
      if (resultado.sucesso) {
        toast.success("Agenda própria removida; o destino passa a herdar.");
      } else {
        toast.error(resultado.erro);
      }
    });
  }

  return (
    <details className="rounded-lg border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{item.nome}</p>
          <p className="text-sm text-gray-500">{item.localidade}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <Badge
            variant={
              item.agendaPropria
                ? "default"
                : item.agendaEfetiva
                  ? "secondary"
                  : "outline"
            }
          >
            {item.agendaPropria
              ? "Agenda própria"
              : item.agendaEfetiva
                ? "Herdada"
                : "Sem agenda"}
          </Badge>
          <span className="max-w-[12rem] truncate text-xs text-gray-500 sm:max-w-none">
            {item.agendaEfetiva?.origem ?? "Entrega Própria indisponível"}
          </span>
        </div>
      </summary>
      <form
        className="space-y-5 border-t border-gray-100 p-4"
        onSubmit={salvar}
      >
        <ResumoAgendaGeograficaEmUso agenda={item.agendaEfetiva} />

        <SeletorDiasAtendidosEntregaPropria
          dias={dias}
          erro={errors.diasAtendidos?.message}
          onAlternar={alternarDia}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`corte-${idCampo}`}>Horário de corte</Label>
            <Input
              id={`corte-${idCampo}`}
              type="time"
              {...register("horarioCorte")}
            />
            {errors.horarioCorte ? (
              <p className="text-sm text-red-600">
                {errors.horarioCorte.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`bloqueios-${idCampo}`}>Datas bloqueadas</Label>
            <Input
              id={`bloqueios-${idCampo}`}
              {...register("bloqueiosTexto")}
              placeholder="Ex.: 2026-12-25, 2027-01-01"
            />
            {errors.bloqueiosTexto ? (
              <p className="text-sm text-red-600">
                {errors.bloqueiosTexto.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {item.agendaPropria ? (
            <Button
              type="button"
              variant="outline"
              disabled={ocupado}
              onClick={herdar}
            >
              Remover agenda própria e herdar
            </Button>
          ) : null}
          <Button type="submit" disabled={ocupado}>
            Salvar agenda própria
          </Button>
        </div>
      </form>
    </details>
  );
}
