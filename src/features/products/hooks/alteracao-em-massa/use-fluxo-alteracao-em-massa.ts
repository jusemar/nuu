"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { aplicarAlteracaoEmMassa } from "../../actions/aplicar-alteracao-em-massa";
import { solicitarPreviewAlteracaoEmMassa } from "../../actions/preview-alteracao-em-massa";
import type { OperacaoAlteracaoEmMassa } from "../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type {
  PreviewServidorAlteracaoEmMassa,
  ResultadoAplicacaoAlteracaoEmMassa,
} from "../../types/resultado-alteracao-em-massa.types";

export function useFluxoAlteracaoEmMassa({
  produtosIds,
  operacoes,
  onSucesso,
}: {
  produtosIds: string[];
  operacoes: OperacaoAlteracaoEmMassa[];
  onSucesso: () => void;
}) {
  const router = useRouter();
  const [previewServidor, setPreviewServidor] =
    useState<PreviewServidorAlteracaoEmMassa | null>(null);
  const [resultado, setResultado] =
    useState<ResultadoAplicacaoAlteracaoEmMassa | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  const invalidarPreview = useCallback(() => {
    setPreviewServidor(null);
    setResultado(null);
  }, []);

  async function revisar() {
    if (revisando || aplicando) return;
    setRevisando(true);
    try {
      const resposta = await solicitarPreviewAlteracaoEmMassa({
        produtosIds,
        operacoes,
      });
      if (!resposta.sucesso) {
        toast.error(resposta.erro);
        return false;
      }
      setPreviewServidor(resposta.preview);
      setResultado(null);
      toast.success("Preview autoritativo concluído.");
      return true;
    } finally {
      setRevisando(false);
    }
  }

  async function aplicar() {
    if (!previewServidor || aplicando || revisando) return;
    setAplicando(true);
    try {
      const resposta = await aplicarAlteracaoEmMassa({
        produtosIds,
        operacoes,
        assinaturaPreview: previewServidor.assinaturaPreview,
      });
      if (!resposta.resultado) {
        toast.error(resposta.erro);
        if (resposta.requerNovoPreview) setPreviewServidor(null);
        return;
      }
      setResultado(resposta.resultado);
      if (resposta.resultado.status === "sucesso") {
        toast.success("Alterações aplicadas com sucesso.");
        setPreviewServidor(null);
        onSucesso();
        router.refresh();
      } else {
        toast.warning(resposta.erro);
      }
    } finally {
      setAplicando(false);
    }
  }

  return {
    previewServidor,
    resultado,
    revisando,
    aplicando,
    revisar,
    aplicar,
    invalidarPreview,
    limparResultado: () => setResultado(null),
  };
}
