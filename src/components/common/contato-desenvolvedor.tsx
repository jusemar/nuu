"use client";

import { Code2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BotaoCanalHumano } from "@/features/contato/components/store/botoes-canais-humanos";

/**
 * Mantém a autoria separada da navegação e dos dados empresariais. Os destinos
 * continuam protegidos pela mesma Server Action usada na página de contato.
 */
export function ContatoDesenvolvedor() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="h-auto p-0 text-xs font-medium text-white/65 underline-offset-4 hover:text-white hover:underline"
        >
          Junior Rocha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="bg-primary/10 text-primary mx-auto flex size-10 items-center justify-center rounded-xl sm:mx-0">
            <Code2 className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="pt-1">Contato do desenvolvedor</DialogTitle>
          <DialogDescription>
            Este contato é destinado exclusivamente ao desenvolvedor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <BotaoCanalHumano
            canal="whatsapp_desenvolvedor"
            rotulo="Falar com Junior Rocha"
          />
        </div>
        <p className="text-muted-foreground text-center text-xs leading-relaxed sm:text-left">
          Os dados de contato são carregados somente após escolher uma opção.
        </p>
      </DialogContent>
    </Dialog>
  );
}
