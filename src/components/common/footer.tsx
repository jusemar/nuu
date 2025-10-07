import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">
                <svg width='1em' height='1em' viewBox='0 0 324 323' fill='currentColor'>
                  <rect
                    x='88.1023'
                    y='144.792'
                    width='151.802'
                    height='36.5788'
                    rx='18.2894'
                    transform='rotate(-38.5799 88.1023 144.792)'
                    fill='currentColor'
                  />
                  <rect
                    x='85.3459'
                    y='244.537'
                    width='151.802'
                    height='36.5788'
                    rx='18.2894'
                    transform='rotate(-38.5799 85.3459 244.537)'
                    fill='currentColor'
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">Do Rocha</span>
            </div>
            <p className="text-gray-400 text-sm">
              Sua loja confiável para produtos de qualidade com entrega em todo Brasil.
            </p>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link></li>
              <li><Link href="/fale-conosco" className="hover:text-white transition-colors">Fale Conosco</Link></li>
              <li><Link href="/fornecedor" className="hover:text-white transition-colors">Fornecedor</Link></li>
              <li><Link href="/entregas" className="hover:text-white transition-colors">Entregas</Link></li>
              <li><Link href="/garantias" className="hover:text-white transition-colors">Garantias</Link></li>
            </ul>
          </div>

          {/* Ajuda */}
          <div>
            <h3 className="font-semibold mb-4">Ajuda</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Serviço</Link></li>
              <li><Link href="/devolucao" className="hover:text-white transition-colors">Política de Devolução</Link></li>
              <li><Link href="/reembolso" className="hover:text-white transition-colors">Política de Reembolso</Link></li>
            </ul>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <div className="text-sm text-gray-400">
            <span>© 2025 Do Rocha · </span>
            <span 
              className="hover:text-white transition-colors cursor-help"
              title="31 99430-4473"
            >
              Desenvolvido por : Junior Rocha
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};