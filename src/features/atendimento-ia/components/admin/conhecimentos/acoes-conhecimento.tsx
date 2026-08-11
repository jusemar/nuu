"use client";

import { Archive, Send, Upload } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { arquivarConhecimento } from "@/features/atendimento-ia/actions/conhecimento/arquivar-conhecimento";
import { enviarConhecimentoRevisao } from "@/features/atendimento-ia/actions/conhecimento/enviar-conhecimento-revisao";
import { publicarConhecimento } from "@/features/atendimento-ia/actions/conhecimento/publicar-conhecimento";
import { revisarConhecimento } from "@/features/atendimento-ia/actions/conhecimento/revisar-conhecimento";

export function AcoesConhecimento({
  conhecimentoId,
  estado,
  situacao,
  atualizadoEm,
  versaoId,
  podePublicar,
  elegivel,
  hash,
  podeRevisar,
  revisadoEm,
}: {
  conhecimentoId: string;
  estado: string | null;
  situacao: "ativa" | "arquivada";
  atualizadoEm: string | null;
  versaoId: string | null;
  podePublicar: boolean;
  elegivel: boolean;
  hash: string | null;
  podeRevisar: boolean;
  revisadoEm: string | null;
}) {
  const [pendente, iniciar] = useTransition();
  const executar = (acao: () => Promise<unknown>, mensagem: string) =>
    iniciar(async () => {
      try {
        await acao();
        toast.success(mensagem);
      } catch (erro) {
        toast.error(
          erro instanceof Error ? erro.message : "Não foi possível concluir.",
        );
      }
    });
  return (
    <div className="flex flex-wrap gap-2">
      {podePublicar && elegivel && versaoId ? (
        <Button
          size="sm"
          disabled={pendente}
          onClick={() => {
            if (
              !window.confirm(
                `Publicar explicitamente esta versão?\nHash: ${hash ?? "indisponível"}\nA versão atual será preservada no histórico.`,
              )
            )
              return;
            const justificativaAlertas =
              window
                .prompt("Justificativa para alertas (vazio se não houver):")
                ?.trim() || undefined;
            executar(
              () =>
                publicarConhecimento({
                  versaoId,
                  chaveIdempotencia: `admin:${versaoId}:${crypto.randomUUID()}`,
                  justificativaAlertas,
                }),
              "Conhecimento publicado e indexado.",
            );
          }}
        >
          <Upload /> Publicar
        </Button>
      ) : null}
      {estado === "rascunho" && versaoId && atualizadoEm ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pendente}
          onClick={() =>
            executar(
              () =>
                enviarConhecimentoRevisao({
                  atualizadoEmEsperado: atualizadoEm,
                  versaoId,
                }),
              "Rascunho enviado para revisão.",
            )
          }
        >
          <Send /> Enviar para revisão
        </Button>
      ) : null}
      {podeRevisar &&
      estado === "em_revisao" &&
      !revisadoEm &&
      versaoId &&
      atualizadoEm ? (
        <>
          <Button
            size="sm"
            disabled={pendente}
            onClick={() =>
              executar(
                () =>
                  revisarConhecimento({
                    atualizadoEmEsperado: atualizadoEm,
                    decisao: "aprovada",
                    motivo: "Conteúdo institucional aprovado na revisão.",
                    versaoId,
                  }),
                "Conhecimento aprovado sem publicação automática.",
              )
            }
          >
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pendente}
            onClick={() =>
              executar(
                () =>
                  revisarConhecimento({
                    atualizadoEmEsperado: atualizadoEm,
                    decisao: "reprovada",
                    motivo: "Conteúdo requer ajustes antes da publicação.",
                    versaoId,
                  }),
                "Conhecimento reprovado e devolvido para ajustes.",
              )
            }
          >
            Reprovar
          </Button>
        </>
      ) : null}
      {situacao === "ativa" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pendente}
          onClick={() =>
            executar(
              () => arquivarConhecimento({ conhecimentoId }),
              "Conhecimento arquivado sem apagar o histórico.",
            )
          }
        >
          <Archive /> Arquivar
        </Button>
      ) : null}
    </div>
  );
}
