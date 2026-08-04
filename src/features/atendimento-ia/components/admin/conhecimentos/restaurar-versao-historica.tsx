"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { restaurarVersaoComportamento } from "@/features/atendimento-ia/actions/comportamento/restaurar-versao-comportamento";
import { restaurarVersaoConhecimento } from "@/features/atendimento-ia/actions/conhecimento/restaurar-versao-conhecimento";

export function RestaurarVersaoHistorica({
  hashHistorico,
  hashPublicado,
  numeroHistorico,
  numeroPublicado,
  recursoId,
  tipo,
  versaoAtual,
  versaoOrigemId,
}: {
  hashHistorico: string;
  hashPublicado: string | null;
  numeroHistorico: number;
  numeroPublicado: number | null;
  recursoId: string;
  tipo: "conhecimento" | "comportamento";
  versaoAtual: number;
  versaoOrigemId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [pendente, iniciar] = useTransition();
  const chaveIdempotencia = useRef<string | null>(null);
  const comparacao = hashPublicado
    ? hashPublicado === hashHistorico
      ? "O conteúdo é idêntico ao atualmente publicado."
      : "O conteúdo difere da versão atualmente publicada."
    : "Não existe versão publicada para comparação."

  if (!aberto)
    return (
      <Button size="sm" variant="outline" onClick={() => setAberto(true)}>
        Restaurar como nova versão
      </Button>
    );

  return (
    <div className="mt-3 grid gap-2 rounded-md border p-3">
      <p className="font-medium">
        Restaurar versão {numeroHistorico} como nova candidata
      </p>
      <p className="text-muted-foreground">
        Comparação com publicada {numeroPublicado ?? "—"}: {comparacao}
      </p>
      <p className="text-muted-foreground">
        Nenhuma publicação, indexação ou ativação ocorrerá. A nova versão
        começará como rascunho e deverá passar por revisão, testes,
        elegibilidade e publicação.
      </p>
      <label className="grid gap-1">
        <span className="text-sm font-medium">Justificativa obrigatória</span>
        <Input
          value={justificativa}
          maxLength={1_000}
          minLength={10}
          onChange={(evento) => setJustificativa(evento.target.value)}
          placeholder="Explique por que esta versão deve voltar como candidata"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pendente || justificativa.trim().length < 10}
          onClick={() =>
            iniciar(async () => {
              try {
                chaveIdempotencia.current ??=
                  `admin-restauracao:${crypto.randomUUID()}`;
                const entrada = {
                  chaveIdempotencia: chaveIdempotencia.current,
                  justificativa,
                  recursoId,
                  versaoAtualEsperada: versaoAtual,
                  versaoOrigemId,
                };
                const resultado =
                  tipo === "conhecimento"
                    ? await restaurarVersaoConhecimento(entrada)
                    : await restaurarVersaoComportamento(entrada);
                toast.success(
                  `Versão ${resultado.versao} criada como rascunho. Próximos passos: revisão, testes e elegibilidade.`,
                );
                setAberto(false);
                setJustificativa("");
                chaveIdempotencia.current = null;
              } catch (erro) {
                toast.error(
                  erro instanceof Error
                    ? erro.message
                    : "Não foi possível restaurar a versão.",
                );
              }
            })
          }
        >
          Criar candidata em rascunho
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pendente}
          onClick={() => {
            setAberto(false);
            chaveIdempotencia.current = null;
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
