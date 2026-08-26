import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import {
  DADOS_EMPRESA,
  ENDERECO_EMPRESA_FORMATADO,
} from "@/features/configuracoes-loja/constants/dados-empresa";
import { listarGruposRodapePublicos } from "@/features/paginas-dinamicas/queries/listar-grupos-rodape-publicos";

export const Footer = async () => {
  const grupos = await listarGruposRodapePublicos();
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* ── Corpo principal ── */}
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Marca + descrição */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              {/* Ícone logo */}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/15">
                <span className="text-sm font-bold tracking-tight text-white select-none">
                  {DADOS_EMPRESA.iniciaisMarca}
                </span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                {DADOS_EMPRESA.marca}
              </span>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-white/70">
              Sua loja confiável para produtos de qualidade com entrega em todo
              o Brasil. Garantia, segurança e atendimento humano em cada compra.
            </p>

            <address className="mb-5 space-y-1 text-xs leading-relaxed text-white/70 not-italic">
              <p>
                {DADOS_EMPRESA.razaoSocial} · CNPJ {DADOS_EMPRESA.cnpj}
              </p>
              <p>{ENDERECO_EMPRESA_FORMATADO}</p>
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                <a
                  href={`mailto:${DADOS_EMPRESA.emailAtendimento}`}
                  className="focus-visible:ring-warning rounded-sm hover:text-white focus-visible:ring-2 focus-visible:outline-none"
                >
                  {DADOS_EMPRESA.emailAtendimento}
                </a>
                <a
                  href={`https://wa.me/${DADOS_EMPRESA.telefone.whatsappOperacional}`}
                  className="focus-visible:ring-warning rounded-sm hover:text-white focus-visible:ring-2 focus-visible:outline-none"
                >
                  WhatsApp {DADOS_EMPRESA.telefone.exibicao}
                </a>
              </p>
            </address>

            {/* Selos de confiança */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: "🔒", label: "Compra segura" },
                { icon: "🚚", label: "Frete grátis +R$299" },
                { icon: "⭐", label: "Garantia 12 meses" },
              ].map((selo) => (
                <Badge
                  key={selo.label}
                  className="rounded-full border-transparent bg-white/12 px-3 py-1.5 text-white/90"
                >
                  <span>{selo.icon}</span>
                  {selo.label}
                </Badge>
              ))}
            </div>
          </div>

          {grupos.map((grupo) => (
            <nav key={grupo.id} aria-label={grupo.titulo}>
              <h2 className="text-warning mb-4 text-xs font-bold tracking-widest uppercase">
                {grupo.titulo}
              </h2>
              <ul className="space-y-2.5 text-sm text-white/70">
                {grupo.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="focus-visible:ring-warning focus-visible:ring-offset-primary rounded-sm transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {link.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>

      {/* ── Rodapé inferior ── */}
      <div className="border-t border-white/12">
        <Container className="flex flex-col items-center justify-between gap-2 py-4 sm:flex-row">
          <span className="text-xs text-white/50">
            © {anoAtual} {DADOS_EMPRESA.marca}. Todos os direitos reservados.
          </span>
          <span className="text-xs text-white/50">
            Desenvolvido por Junior Rocha
          </span>
        </Container>
      </div>
    </footer>
  );
};
