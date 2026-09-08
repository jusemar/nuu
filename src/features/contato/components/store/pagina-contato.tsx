import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/common/footer";
import { Container } from "@/components/ui/container";
import { BarraAvisos } from "@/features/configuracoes-loja/components/store/barra-avisos";
import { buscarBarraAvisos } from "@/features/configuracoes-loja/queries/buscar-barra-avisos";
import { Header } from "@/features/header";

import { CanaisContato } from "./canais-contato";
import { FormularioContato } from "./formulario-contato";
import { HeroContato } from "./hero-contato";
import { AcompanhamentoPedido } from "./informacoes-contato";

export async function PaginaContato() {
  const barraAvisos = await buscarBarraAvisos();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <BarraAvisos configuracao={barraAvisos} />
      <Header />
      <Container
        as="main"
        className="space-y-10 py-6 sm:space-y-12 sm:py-8 lg:py-10"
      >
        <nav aria-label="Breadcrumb">
          <ol className="text-muted-foreground flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/"
                className="hover:text-primary focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                <Home className="size-3.5" aria-hidden="true" />
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="text-foreground font-medium" aria-current="page">
              Fale conosco
            </li>
          </ol>
        </nav>

        <HeroContato />
        <CanaisContato />
        <AcompanhamentoPedido />
        <FormularioContato />
      </Container>
      <Footer />
    </div>
  );
}
