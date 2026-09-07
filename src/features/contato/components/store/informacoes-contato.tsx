import {
  ArrowRight,
  Building2,
  HelpCircle,
  PackageSearch,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DADOS_EMPRESA,
  ENDERECO_EMPRESA_FORMATADO,
} from "@/features/configuracoes-loja/constants/dados-empresa";

const PERGUNTAS = [
  { texto: "Como acompanhar meu pedido?", href: "/minha-conta/pedidos" },
  { texto: "Quais são os prazos de entrega?", href: "/entrega" },
  {
    texto: "Como funciona a troca ou devolução?",
    href: "/trocas-e-devolucoes",
  },
  { texto: "Formas de pagamento", href: "/formas-de-pagamento" },
  { texto: "Produtos e garantia", href: "/atendimento" },
] as const;

export function AcompanhamentoPedido() {
  return (
    <section className="border-primary/15 bg-primary-light flex flex-col gap-5 rounded-2xl border p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-xl">
          <PackageSearch className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold">
            Já tem um pedido? Acompanhe aqui.
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Você também pode verificar o status do seu pedido diretamente na sua
            conta.
          </p>
        </div>
      </div>
      <Button asChild size="lg" className="shrink-0">
        <Link href="/minha-conta/pedidos">
          Acessar meus pedidos
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}

export function InformacoesContato() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
            <HelpCircle className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-2 text-xl leading-none font-semibold">
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground text-sm">
            Talvez sua dúvida já tenha uma resposta.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {PERGUNTAS.map((pergunta) => (
              <li key={pergunta.texto}>
                <Link
                  href={pergunta.href}
                  className="focus-visible:ring-ring hover:text-primary flex items-center justify-between gap-3 rounded-sm py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {pergunta.texto}
                  <ArrowRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="link" className="mt-4 h-auto px-0">
            <Link href="/atendimento">
              Ver todas as perguntas frequentes
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-2 text-xl leading-none font-semibold">
              Dados da empresa
            </h2>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p className="text-foreground font-semibold">
              {DADOS_EMPRESA.razaoSocial}
            </p>
            <p>CNPJ: {DADOS_EMPRESA.cnpj}</p>
            <address className="not-italic">
              {ENDERECO_EMPRESA_FORMATADO}
            </address>
            <p className="text-primary pt-1 font-semibold">
              Atendemos todo o Brasil
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-4">
            <ShieldCheck
              className="text-primary size-7 shrink-0"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-bold">Segurança no atendimento</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Nossos canais oficiais são apenas os exibidos nesta página.
                Nunca solicitamos dados sensíveis por telefone, e-mail ou
                WhatsApp.
              </p>
              <Button asChild variant="link" className="mt-3 h-auto px-0">
                <Link href="/seguranca">
                  Saiba mais sobre segurança
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
