"use client";

import { LoaderCircle, Mail, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  type CanalContatoHumano,
  obterDestinoCanalContato,
} from "@/features/contato/actions/obter-destino-canal-contato";
import { cn } from "@/lib/utils";

type PropriedadesBotaoCanal = {
  canal: CanalContatoHumano;
  className?: string;
};

export function BotaoCanalHumano({ canal, className }: PropriedadesBotaoCanal) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();
  const whatsapp = canal === "whatsapp";
  const Icone = whatsapp ? MessageCircle : Mail;

  function abrirCanal() {
    if (pendente) return;
    setErro(null);

    // Abrir antes da chamada assíncrona evita que o navegador bloqueie o pop-up.
    const novaJanela = whatsapp ? window.open("about:blank", "_blank") : null;
    if (novaJanela) novaJanela.opener = null;

    iniciarTransicao(async () => {
      const resultado = await obterDestinoCanalContato(canal);
      if (!resultado.sucesso) {
        novaJanela?.close();
        setErro(resultado.mensagem);
        return;
      }

      if (whatsapp && novaJanela) {
        novaJanela.location.replace(resultado.destino);
        return;
      }

      if (whatsapp) {
        setErro("Permita pop-ups para abrir o WhatsApp.");
        return;
      }

      window.location.assign(resultado.destino);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={whatsapp ? "success" : "warning"}
        size="lg"
        onClick={abrirCanal}
        disabled={pendente}
        aria-describedby={erro ? `erro-canal-${canal}` : undefined}
        className={cn("w-full", className)}
      >
        {pendente ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Icone aria-hidden="true" />
        )}
        {whatsapp ? "Falar no WhatsApp" : "Enviar e-mail"}
      </Button>
      {erro ? (
        <p
          id={`erro-canal-${canal}`}
          className="text-destructive text-sm"
          role="alert"
        >
          {erro}
        </p>
      ) : null}
    </div>
  );
}
