"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  alterarImagemProdutoRepresentante,
  enviarImagemProdutoRepresentante,
} from "../../../actions/representantes/gerenciar-imagens-representante";
import { chavesProdutosRepresentante } from "../../../constants/representantes/query-keys";
import type { ProdutoRepresentanteEdicao } from "../../../types/representantes/produto-representante.types";

export function GaleriaProdutoRepresentante({
  produtoId,
  fornecedorId,
  imagens,
}: {
  produtoId: string;
  fornecedorId: string;
  imagens: ProdutoRepresentanteEdicao["imagens"];
}) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const cliente = useQueryClient();
  const atualizar = async () => {
    await cliente.invalidateQueries({
      queryKey: chavesProdutosRepresentante.todas,
    });
  };
  const upload = useMutation({
    mutationFn: async (arquivo: File) => {
      const dados = new FormData();
      dados.set("fornecedorId", fornecedorId);
      dados.set("produtoId", produtoId);
      dados.set("arquivo", arquivo);
      const resultado = await enviarImagemProdutoRepresentante(dados);
      if (!resultado.sucesso) throw new Error(resultado.mensagem);
    },
    onSuccess: async () => {
      if (arquivoRef.current) arquivoRef.current.value = "";
      await atualizar();
      toast.success("Imagem adicionada.");
    },
    onError: (e) => toast.error(e.message),
  });
  const alterar = useMutation({
    mutationFn: async ({
      imagemId,
      acao,
    }: {
      imagemId: string;
      acao: "remover" | "principal" | "subir" | "descer";
    }) => {
      const resultado = await alterarImagemProdutoRepresentante({
        produtoId,
        fornecedorId,
        imagemId,
        acao,
      });
      if (!resultado.sucesso) throw new Error(resultado.mensagem);
    },
    onSuccess: atualizar,
    onError: (e) => toast.error(e.message),
  });
  const ocupado = upload.isPending || alterar.isPending;
  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="imagem-representante">Adicionar imagem</Label>
        <Input
          ref={arquivoRef}
          type="file"
          id="imagem-representante"
          accept="image/jpeg,image/png,image/webp"
          className="h-auto min-h-11 max-w-full py-2"
          disabled={ocupado || imagens.length >= 20}
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) upload.mutate(arquivo);
          }}
        />
        <p className="text-muted-foreground text-xs">
          JPG, PNG ou WebP, até 4 MB. Máximo de 20 imagens.
        </p>
        {upload.isPending && (
          <p role="status" className="text-sm">
            Enviando imagem…
          </p>
        )}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {imagens.map((imagem, indice) => (
          <div
            key={imagem.id}
            className="min-w-0 space-y-2 rounded-lg border p-3"
          >
            { }
            <Image
              unoptimized
              width={480}
              height={320}
              src={imagem.url}
              alt={imagem.alt || "Imagem do produto"}
              className="h-40 w-full rounded-md object-contain"
            />
            <p className="text-muted-foreground text-xs">
              {imagem.principal ? "Imagem principal" : `Imagem ${indice + 1}`}
            </p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  {
                    acao: "principal",
                    rotulo: "Definir como principal",
                    icone: Star,
                    bloqueado: imagem.principal,
                  },
                  {
                    acao: "subir",
                    rotulo: "Mover imagem para cima",
                    icone: ArrowUp,
                    bloqueado: indice === 0,
                  },
                  {
                    acao: "descer",
                    rotulo: "Mover imagem para baixo",
                    icone: ArrowDown,
                    bloqueado: indice === imagens.length - 1,
                  },
                  {
                    acao: "remover",
                    rotulo: "Remover imagem",
                    icone: Trash2,
                    bloqueado: false,
                  },
                ] as const
              ).map((a) => (
                <Button
                  key={a.acao}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label={a.rotulo}
                  title={a.rotulo}
                  disabled={ocupado || a.bloqueado}
                  onClick={() =>
                    alterar.mutate({ imagemId: imagem.id, acao: a.acao })
                  }
                >
                  <a.icone className="size-4" />
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
