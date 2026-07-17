"use client";

import { useCallback, useRef, useState } from "react";
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
  onAtualizarListagem,
}: {
  produtosIds: string[];
  operacoes: OperacaoAlteracaoEmMassa[];
  onSucesso: () => void;
  onAtualizarListagem: () => Promise<void>;
}) {
  const aplicacaoEmAndamento = useRef(false);
  const [previewServidor, setPreviewServidor] =
    useState<PreviewServidorAlteracaoEmMassa | null>(null);
  const [resultado, setResultado] =
    useState<ResultadoAplicacaoAlteracaoEmMassa | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [erroControlado, setErroControlado] = useState<string | null>(null);
  const [erroAtualizacao, setErroAtualizacao] = useState<string | null>(null);
  const [atualizandoListagem, setAtualizandoListagem] = useState(false);

  async function atualizarListagem() {
    if (atualizandoListagem) return false;
    setAtualizandoListagem(true);
    setErroAtualizacao(null);
    try {
      await onAtualizarListagem();
      return true;
    } catch (erro) {
      console.error("[produtos:alteracao-em-massa:atualizacao-cliente]", erro);
      setErroAtualizacao(
        "Não foi possível atualizar a listagem agora. Tente novamente sem reaplicar o lote.",
      );
      return false;
    } finally {
      setAtualizandoListagem(false);
    }
  }

  const invalidarPreview = useCallback(() => {
    setPreviewServidor(null);
    setResultado(null);
    setErroControlado(null);
  }, []);

  async function revisar() {
    if (revisando || aplicando) return;
    setRevisando(true);
    setErroControlado(null);
    try {
      const resposta = await solicitarPreviewAlteracaoEmMassa({
        produtosIds,
        operacoes,
      });
      if (!resposta.sucesso) {
        const mensagem = resposta.erro ?? "Não foi possível gerar o preview.";
        setErroControlado(mensagem);
        toast.error(mensagem);
        return false;
      }
      setPreviewServidor(resposta.preview);
      setResultado(null);
      toast.success("Preview autoritativo concluído.");
      return true;
    } catch (erro) {
      console.error("[produtos:alteracao-em-massa:preview-cliente]", erro);
      const mensagem =
        "Não foi possível gerar o preview. A página continua disponível; tente novamente.";
      setErroControlado(mensagem);
      toast.error(mensagem);
      return false;
    } finally {
      setRevisando(false);
    }
  }

  async function aplicar() {
    if (
      !previewServidor ||
      aplicando ||
      revisando ||
      aplicacaoEmAndamento.current
    )
      return;
    aplicacaoEmAndamento.current = true;
    setAplicando(true);
    setErroControlado(null);
    try {
      const resposta = await aplicarAlteracaoEmMassa({
        produtosIds,
        operacoes,
        assinaturaPreview: previewServidor.assinaturaPreview,
      });
      if (!resposta.resultado) {
        const mensagem =
          resposta.erro ?? "Não foi possível aplicar as alterações.";
        setErroControlado(mensagem);
        toast.error(mensagem);
        if (resposta.requerNovoPreview) setPreviewServidor(null);
        return;
      }
      setResultado(resposta.resultado);
      if (resposta.resultado.status === "sucesso") {
        toast.success("Alterações aplicadas com sucesso.");
        setPreviewServidor(null);
        onSucesso();
        await atualizarListagem();
      } else {
        toast.warning(resposta.erro);
      }
    } catch (erro) {
      console.error("[produtos:alteracao-em-massa:aplicacao-cliente]", erro);
      const mensagem =
        "A aplicação não pôde ser concluída. Nenhum recarregamento automático será feito; gere um novo preview e tente novamente.";
      setErroControlado(mensagem);
      setPreviewServidor(null);
      toast.error(mensagem);
    } finally {
      aplicacaoEmAndamento.current = false;
      setAplicando(false);
    }
  }

  return {
    previewServidor,
    resultado,
    revisando,
    aplicando,
    erroControlado,
    erroAtualizacao,
    atualizandoListagem,
    revisar,
    aplicar,
    invalidarPreview,
    limparResultado: () => setResultado(null),
    atualizarListagem,
  };
}
