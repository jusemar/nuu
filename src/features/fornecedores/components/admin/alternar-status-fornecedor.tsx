"use client";

import { useRef, useTransition } from "react";

import { Switch } from "@/components/ui/switch";

import { salvarFornecedor } from "../../actions";
import type { FornecedorComResumoImportacoes } from "../../types/fornecedores.types";

type AlternarStatusFornecedorProps = {
  fornecedor: FornecedorComResumoImportacoes;
};

export function AlternarStatusFornecedor({
  fornecedor,
}: AlternarStatusFornecedorProps) {
  const formularioRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const fornecedorAtivo = fornecedor.status === "ativo";

  function alternarStatus() {
    startTransition(() => {
      formularioRef.current?.requestSubmit();
    });
  }

  return (
    <form ref={formularioRef} action={salvarFornecedor}>
      <input type="hidden" name="id" value={fornecedor.id} />
      <input type="hidden" name="nome" value={fornecedor.nome} />
      <input
        type="hidden"
        name="tipoIntegracao"
        value={fornecedor.tipoIntegracao}
      />
      <input
        type="hidden"
        name="status"
        value={fornecedorAtivo ? "inativo" : "ativo"}
      />
      <Switch
        aria-label={
          fornecedorAtivo ? "Inativar fornecedor" : "Ativar fornecedor"
        }
        checked={fornecedorAtivo}
        disabled={isPending || fornecedor.status === "pendente"}
        onCheckedChange={alternarStatus}
      />
    </form>
  );
}
