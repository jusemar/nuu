"use client";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useEditarCampoRepresentante } from "../../../hooks/representantes/use-produtos-representante";

export function EditarCampoInline({
  produtoId,
  fornecedorId,
  versao,
  campo,
  valor,
  permitido,
}: {
  produtoId: string;
  fornecedorId: string;
  versao: string;
  campo: "nome" | "precoCentavos" | "estoque";
  valor: string | number;
  permitido: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [erro, setErro] = useState("");
  const mutacao = useEditarCampoRepresentante();
  const rotulo =
    campo === "nome"
      ? "Nome do produto"
      : campo === "precoCentavos"
        ? "Preço"
        : "Estoque";
  const exibido =
    campo === "precoCentavos"
      ? (Number(valor) / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : String(valor);
  async function salvar() {
    const texto = rascunho.trim();
    let novo: string | number = texto;
    if (campo !== "nome") {
      if (
        !(campo === "estoque" ? /^\d+$/ : /^\d+(?:[,.]\d{1,2})?$/).test(texto)
      ) {
        setErro("Informe um valor válido.");
        return;
      }
      novo =
        campo === "estoque"
          ? Number(texto)
          : Math.round(Number(texto.replace(",", ".")) * 100);
    } else if (texto.length < 2) {
      setErro("Informe pelo menos 2 caracteres.");
      return;
    }
    try {
      await mutacao.mutateAsync({
        produtoId,
        fornecedorId,
        versao,
        alteracao: { campo, valor: novo },
      });
      setEditando(false);
    } catch {
      /* O hook informa o erro e atualiza a autorização. */
    }
  }
  if (!permitido) return <span>{exibido}</span>;
  if (!editando)
    return (
      <Button
        type="button"
        variant="ghost"
        className={`h-auto min-h-11 max-w-full justify-start gap-2 px-1 text-left whitespace-normal ${campo === "nome" ? "font-semibold" : "font-normal tabular-nums"}`}
        aria-label={`Editar ${rotulo.toLowerCase()}`}
        onClick={() => {
          setRascunho(
            campo === "precoCentavos"
              ? (Number(valor) / 100).toFixed(2).replace(".", ",")
              : String(valor),
          );
          setErro("");
          setEditando(true);
        }}
      >
        <span className="min-w-0 break-words">{exibido}</span>
        <Pencil
          className="text-muted-foreground size-3.5 shrink-0"
          aria-hidden="true"
        />
      </Button>
    );
  return (
    <div className="w-full min-w-0 space-y-1">
      <div className="flex min-w-0 items-center gap-1">
        <Input
          autoFocus
          aria-label={rotulo}
          value={rascunho}
          maxLength={campo === "nome" ? 200 : 15}
          inputMode={
            campo === "nome"
              ? "text"
              : campo === "estoque"
                ? "numeric"
                : "decimal"
          }
          disabled={mutacao.isPending}
          className="h-11 min-w-0 flex-1"
          onChange={(e) => {
            setRascunho(e.target.value);
            setErro("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void salvar();
            }
            if (e.key === "Escape" && !mutacao.isPending) setEditando(false);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          aria-label={`Salvar ${rotulo.toLowerCase()}`}
          disabled={mutacao.isPending}
          onClick={() => void salvar()}
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Cancelar edição"
          disabled={mutacao.isPending}
          onClick={() => setEditando(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
      {erro && (
        <p role="alert" className="text-destructive text-xs">
          {erro}
        </p>
      )}
    </div>
  );
}
