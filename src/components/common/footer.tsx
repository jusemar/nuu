import Link from 'next/link';

export const Footer = () => {
  return (
    <footer style={{ background: '#0C447C' }} className="text-white">

      {/* ── Corpo principal ── */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Marca + descrição */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              {/* Ícone logo */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <span className="text-white font-bold text-sm tracking-tight select-none">DR</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Do Rocha</span>
            </div>

            <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Sua loja confiável para produtos de qualidade com entrega em todo o Brasil.
              Garantia, segurança e atendimento humano em cada compra.
            </p>

            {/* Selos de confiança */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: '🔒', label: 'Compra segura' },
                { icon: '🚚', label: 'Frete grátis +R$299' },
                { icon: '⭐', label: 'Garantia 12 meses' },
              ].map(selo => (
                <span
                  key={selo.label}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}
                >
                  <span>{selo.icon}</span>
                  {selo.label}
                </span>
              ))}
            </div>
          </div>

          {/* Empresa */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: '#EF9F27' }} /* âmbar — destaque */
            >
              Empresa
            </h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {[
                { href: '/sobre',        label: 'Sobre nós'   },
                { href: '/fale-conosco', label: 'Fale Conosco'},
                { href: '/fornecedor',   label: 'Fornecedor'  },
                { href: '/entregas',     label: 'Entregas'    },
                { href: '/garantias',    label: 'Garantias'   },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ajuda */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: '#EF9F27' }}
            >
              Ajuda
            </h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {[
                { href: '/termos',    label: 'Termos de Serviço'      },
                { href: '/devolucao', label: 'Política de Devolução'  },
                { href: '/reembolso', label: 'Política de Reembolso'  },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Rodapé inferior ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © 2025 Do Rocha. Todos os direitos reservados.
          </span>
          <span
            className="text-xs hover:text-white transition-colors cursor-help"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            title="31 99430-4473"
          >
            Desenvolvido por Junior Rocha
          </span>
        </div>
      </div>
    </footer>
  );
};