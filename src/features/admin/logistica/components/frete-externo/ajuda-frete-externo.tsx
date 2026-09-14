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

/** Ícone de ajuda da Disponibilidade do Frete Externo (Produto e Categoria). */
export function AjudaFreteExterno() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-gray-500"
          aria-label="Como funciona a disponibilidade do Frete Externo"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Disponibilidade do Frete Externo</DialogTitle>
          <DialogDescription>
            Define se Correios, Jadlog e demais fretes cotados pela Frenet podem
            ser oferecidos.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-gray-700">
          <li>
            <strong>Desativado:</strong> PAC, Sedex, Jadlog e os demais fretes
            externos não são cotados nem exibidos para o cliente.
          </li>
          <li>
            <strong>Ativado:</strong> o Frete Externo pode participar, mas
            continua sujeito às regras específicas, classificações logísticas,
            transportadoras e serviços já configurados.
          </li>
          <li>
            <strong>Herdar:</strong> usa a configuração da categoria (ou da
            categoria superior). Sem nenhuma configuração, vale o padrão da
            loja: Ativado.
          </li>
          <li>
            <strong>Produto vence Categoria:</strong> um produto com Ativado ou
            Desativado ignora o que a categoria define.
          </li>
          <li>
            Entrega Própria e Retirada são independentes e continuam seguindo
            suas próprias configurações.
          </li>
          <li>
            Produtos expedidos por fornecedor integrado (ex.: Laquila) seguem a
            logística do fornecedor e não são afetados.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
