"use client";

import { Upload } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { importarPlanilhaFornecedorComEstado } from "../../actions/importar-planilha-fornecedor";
import {
  EXTENSOES_ARQUIVO_IMPORTACAO,
  montarMensagemArquivoAcimaDoLimite,
  TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_BYTES,
  TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_FORMATADO,
} from "../../constants/importacao-arquivo";
import type { FornecedorComResumoImportacoes } from "../../types/fornecedores.types";

const EXTENSOES_ACEITAS = EXTENSOES_ARQUIVO_IMPORTACAO.map(
  (extensao) => `.${extensao}`,
).join(",");

type FormularioNovaImportacaoFornecedorProps = {
  /** Fornecedores já ordenados pela página que renderiza este formulário. */
  fornecedores: FornecedorComResumoImportacoes[];
  /** Classe do `<form>`, para a página controlar o layout sem mudar a lógica. */
  className?: string;
};

export function FormularioNovaImportacaoFornecedor({
  fornecedores,
  className,
}: FormularioNovaImportacaoFornecedorProps) {
  // Erro detectado no navegador, assim que o gestor escolhe o arquivo.
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);

  // Erro devolvido pelo servidor (JavaScript desabilitado, chamada direta
  // à action, falha de leitura da planilha etc.).
  const [estadoEnvio, enviar, enviando] = useActionState(
    importarPlanilhaFornecedorComEstado,
    { erro: null },
  );

  // Ao trocar de arquivo, o erro da tentativa anterior deixa de fazer sentido.
  // Sem isso, uma falha antiga do servidor voltaria a aparecer assim que o
  // aviso do navegador fosse limpo.
  const [erroServidorDescartado, setErroServidorDescartado] = useState(false);

  // Toda resposta nova do servidor chega como um objeto novo, então este efeito
  // volta a exibir o erro quando há uma nova tentativa de envio.
  useEffect(() => {
    setErroServidorDescartado(false);
  }, [estadoEnvio]);

  const mensagemErro =
    erroArquivo ?? (erroServidorDescartado ? null : estadoEnvio.erro);

  function aoSelecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    setErroServidorDescartado(true);

    // Sem arquivo (o gestor cancelou a seleção): apenas limpa o aviso.
    if (!arquivo) {
      setErroArquivo(null);
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_BYTES) {
      setErroArquivo(montarMensagemArquivoAcimaDoLimite(arquivo.size));
      // Descarta a seleção para o envio não sair com um arquivo inválido.
      // O input continua utilizável: basta escolher outro arquivo.
      evento.target.value = "";
      return;
    }

    setErroArquivo(null);
  }

  return (
    <form action={enviar} className={className}>
      <select
        name="fornecedorId"
        required
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
      >
        <option value="">Selecione o fornecedor</option>
        {fornecedores.map((fornecedor) => (
          <option key={fornecedor.id} value={fornecedor.id}>
            {fornecedor.nome}
          </option>
        ))}
      </select>
      <input
        name="arquivo"
        type="file"
        required
        accept={EXTENSOES_ACEITAS}
        onChange={aoSelecionarArquivo}
        aria-invalid={mensagemErro ? true : undefined}
        aria-describedby={mensagemErro ? "erro-importacao-arquivo" : undefined}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
      />

      {mensagemErro ? (
        <p
          id="erro-importacao-arquivo"
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {mensagemErro}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Arquivos .xlsx, .xls ou .csv de até{" "}
          {TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_FORMATADO}.
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-1">
        <Upload className="mr-2 h-4 w-4" />
        {enviando ? "Enviando..." : "Enviar para staging"}
      </Button>
    </form>
  );
}
