import { Bot, Check, Clock3, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { BotaoCanalHumano } from "./botoes-canais-humanos";

const BENEFICIOS = {
  ia: ["Disponível 24/7", "Respostas rápidas", "Ajuda em todo o site"],
  whatsapp: [
    "Atendimento em horário comercial",
    "Tire dúvidas sobre pedidos",
    "Suporte pós-venda",
  ],
  email: [
    "Para dúvidas, sugestões ou reclamações",
    "Retorno em até 24 horas",
    "Atendimento humanizado",
  ],
} as const;

function ListaBeneficios({ itens }: { itens: readonly string[] }) {
  return (
    <ul className="text-muted-foreground space-y-2.5 text-sm">
      {itens.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check
            className="text-success mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CanaisContato() {
  return (
    <section aria-labelledby="titulo-canais-contato" className="space-y-6">
      <div className="text-center">
        <h2
          id="titulo-canais-contato"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Como prefere falar com a gente?
        </h2>
        <p className="text-muted-foreground mt-2">
          Escolha o canal mais conveniente para você.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-primary bg-primary text-primary-foreground relative overflow-hidden shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <Badge className="bg-warning text-warning-foreground border-transparent">
                Recomendado
              </Badge>
            </div>
            <h3 className="mt-2 text-xl leading-none font-semibold">
              Falar com a nossa assistente
            </h3>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <p className="text-sm leading-relaxed text-white/80">
              Nossa IA está disponível 24 horas por dia para responder suas
              dúvidas, ajudar no seu pedido e muito mais.
            </p>
            <div className="[&_svg]:text-warning [&_li]:text-white/80">
              <ListaBeneficios itens={BENEFICIOS.ia} />
            </div>
            <Button
              asChild
              variant="warning"
              size="lg"
              className="mt-auto w-full"
            >
              <Link href="/atendimento">
                <MessageCircle aria-hidden="true" />
                Abrir atendimento
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-success/5">
          <CardHeader>
            <span className="bg-success/15 text-success-dark flex size-11 items-center justify-center rounded-xl">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-2 text-xl leading-none font-semibold">
              Atendimento via WhatsApp
            </h3>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Prefere falar com uma pessoa? Nos chame no WhatsApp e nossa equipe
              estará pronta para te atender.
            </p>
            <ListaBeneficios itens={BENEFICIOS.whatsapp} />
            <BotaoCanalHumano canal="whatsapp" className="mt-auto" />
          </CardContent>
        </Card>

        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <span className="bg-warning/20 text-warning-foreground flex size-11 items-center justify-center rounded-xl">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-2 text-xl leading-none font-semibold">
              Enviar um e-mail
            </h3>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Se preferir, envie sua mensagem por e-mail. Nossa equipe
              responderá o mais rápido possível.
            </p>
            <ListaBeneficios itens={BENEFICIOS.email} />
            <BotaoCanalHumano canal="email" className="mt-auto" />
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
        <Clock3 className="size-3.5" aria-hidden="true" />
        Nenhum contato humano é iniciado ou mensagem é enviada sem sua ação.
      </p>
    </section>
  );
}
