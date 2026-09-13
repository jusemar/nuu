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

/**
 * Ícone de ajuda da Agenda Geográfica. Segue o mesmo padrão (Dialog + ícone
 * Info) usado em "Preços de Entrega Própria por destino" no Produto.
 */
export function AjudaAgendaGeograficaEntregaPropria() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-gray-500"
          aria-label="Como funciona a Agenda Geográfica"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Como funciona a Agenda Geográfica</DialogTitle>
          <DialogDescription>
            Define QUANDO a Entrega Própria acontece. Preços ficam no Produto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-6 text-gray-700">
          <p>
            Cada destino pode ter dias de entrega e horário de corte próprios.
            Sem agenda própria, ele herda o nível acima:
          </p>
          <p className="rounded-md bg-gray-50 p-3 font-medium text-gray-900">
            CEP → Bairro → Região → Cidade
          </p>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="font-medium text-gray-900">Exemplo</p>
            <p>
              Belo Horizonte atende Seg/Qua/Sex com corte às 13:00. A Região
              Oeste, sem agenda própria, herda esse calendário. Se a Oeste
              ganhar agenda própria, ela passa a valer para a região — e um
              bairro ou CEP dentro dela ainda pode ter a sua.
            </p>
          </div>
          <p>
            Use &quot;Remover agenda própria e herdar&quot; para voltar a usar o
            calendário do nível superior. Destinos sem agenda em nenhum nível
            não oferecem Entrega Própria.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
