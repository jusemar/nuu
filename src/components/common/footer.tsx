import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { LogoDinamica } from "@/features/configuracoes-loja/components/store/logo-dinamica";
import {
  DADOS_EMPRESA,
  ENDERECO_EMPRESA_FORMATADO,
} from "@/features/configuracoes-loja/constants/dados-empresa";
import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";
import { listarGruposRodapePublicos } from "@/features/paginas-dinamicas/queries/listar-grupos-rodape-publicos";

export const Footer = async () => {
  const [grupos, configuracao] = await Promise.all([
    listarGruposRodapePublicos(),
    buscarConfiguracaoLoja(),
  ]);
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* ── Corpo principal ── */}
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Marca + descrição */}
          <div className="md:col-span-2">
            <LogoDinamica
              local="rodape"
              url={configuracao.logoRodapeUrl}
              className="mb-4"
            />

            <p className="mb-5 text-sm leading-relaxed text-white/70">
              Sua loja confiável para produtos de qualidade com entrega em todo
              o Brasil. Garantia, segurança e atendimento humano em cada compra.
            </p>

            <address className="mb-5 space-y-1 text-xs leading-relaxed text-white/70 not-italic">
              <p>
                {DADOS_EMPRESA.razaoSocial} · CNPJ {DADOS_EMPRESA.cnpj}
              </p>
              <p>{ENDERECO_EMPRESA_FORMATADO}</p>
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
