"use client";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Ajuda da Entrega Própria herdada por Categoria (Produto e Categoria). */
export function AjudaEntregaPropriaCategoria() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-gray-500"
          aria-label="Como funciona a Entrega Própria por categoria"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Entrega Própria por categoria</DialogTitle>
          <DialogDescription>
            A categoria fornece condições padrão; o produto pode ter exceções.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-gray-700">
          <li>
            <strong>Categoria fornece o padrão:</strong> produtos em “Herdar”
            usam a disponibilidade e os preços por destino da categoria.
          </li>
          <li>
            <strong>Produto vence Categoria:</strong> se o produto tiver um
            preço próprio aplicável ao endereço do cliente, ele é usado.
          </li>
          <li>
            <strong>Categoria mais próxima vence:</strong> uma subcategoria com
            configuração prevalece sobre a categoria superior.
          </li>
          <li>
            Dentro de cada fonte vale CEP &gt; Bairro &gt; Região &gt; Cidade.
          </li>
          <li>
            <strong>Dias e horário de corte</strong> vêm sempre da Agenda
            Geográfica (Logística → Entrega Própria → Agenda Geográfica).
          </li>
          <li>
            <strong>Janelas</strong> são as próximas datas válidas da agenda
            após a entrega rápida, não dias corridos. Ex.: agenda Seg/Qua/Sex e
            rápida na segunda → 1 janela = quarta, 2 = sexta, 3 = segunda.
          </li>
          <li>Programada com valor R$ 0 aparece como GRÁTIS para o cliente.</li>
          <li>
            Produtos expedidos por fornecedor integrado (ex.: Laquila) nunca
            recebem Entrega Própria da categoria.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
