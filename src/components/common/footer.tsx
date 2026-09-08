import Link from "next/link";

import { Container } from "@/components/ui/container";
import { LogoDinamica } from "@/features/configuracoes-loja/components/store/logo-dinamica";
import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";
import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";
import { listarGruposRodapePublicos } from "@/features/paginas-dinamicas/queries/listar-grupos-rodape-publicos";

import { ContatoDesenvolvedor } from "./contato-desenvolvedor";

const GRUPOS_NAVEGACAO_FALLBACK = [
  {
    id: "navegacao-essencial",
    titulo: "Navegação",
    links: [
      { id: "inicio", href: "/", texto: "Início" },
      { id: "contato", href: "/contato", texto: "Fale conosco" },
      { id: "atendimento", href: "/atendimento", texto: "Atendimento" },
      {
        id: "pedidos",
        href: "/minha-conta/pedidos",
        texto: "Meus pedidos",
      },
    ],
  },
] as const;

export const Footer = async () => {
  const [grupos, configuracao] = await Promise.all([
    listarGruposRodapePublicos(),
    buscarConfiguracaoLoja(),
  ]);
  const anoAtual = new Date().getFullYear();
  const gruposExibidos = grupos.length > 0 ? grupos : GRUPOS_NAVEGACAO_FALLBACK;

  return (
    <footer className="bg-primary text-primary-foreground">
      <Container className="py-7 sm:py-8">
        <div className="grid gap-7 md:grid-cols-[minmax(280px,1.1fr)_1.6fr] md:gap-10 lg:gap-14">
          <div className="max-w-md">
            <LogoDinamica
              local="rodape"
              url={configuracao.logoRodapeUrl}
              className="mb-2 !h-10 !w-32"
            />
            <p className="text-sm leading-relaxed font-semibold text-white/90">
              Da compra à entrega, tudo pensado para você dizer: Nooo! 😲😁
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/60">
              Uma experiência de compra para surpreender do começo ao fim.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 md:justify-self-end">
            {gruposExibidos.map((grupo) => (
              <nav key={grupo.id} aria-label={grupo.titulo} className="min-w-0">
                <h2 className="text-warning mb-2.5 text-xs font-bold tracking-wider uppercase">
                  {grupo.titulo}
                </h2>
                <ul className="space-y-1.5 text-sm text-white/70">
                  {grupo.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        className="focus-visible:ring-warning focus-visible:ring-offset-primary inline-flex rounded-sm leading-snug transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        {link.texto}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </Container>

      <div className="border-t border-white/12">
        <Container className="grid gap-2 py-3 text-xs text-white/50 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-1">
            <p>
              CNPJ: 48.732.308/0001-58 · Av. Perimetral, 3368, Vila Santa Rita,
              Belo Horizonte/MG
            </p>
            <p>
              © {anoAtual} {DADOS_EMPRESA.marca}. Todos os direitos reservados.
            </p>
          </div>
          <p className="flex items-center gap-1 md:justify-self-end">
            Desenvolvido por <ContatoDesenvolvedor />
          </p>
        </Container>
      </div>
    </footer>
  );
};
