import Link from "next/link";

import { FluxoAutenticacaoCliente } from "@/features/autenticacao/components/store/autenticacao/fluxo-autenticacao-cliente";
import { normalizarDestinoAutenticacao } from "@/features/autenticacao/lib/destino-autenticacao-cliente";
import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";

export default async function Authentication({
  searchParams,
}: {
  searchParams: Promise<{
    destino?: string;
    modo?: string;
    recuperacao?: string;
  }>;
}) {
  const parametros = await searchParams;
  const destino = normalizarDestinoAutenticacao(parametros.destino);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-5">
        <div className="text-center">
          <Link href="/" className="text-base font-semibold text-slate-950">
            {DADOS_EMPRESA.marca}
          </Link>
          <p className="mt-1 text-sm text-slate-500">
            Acesse sua conta da loja.
          </p>
        </div>
        <FluxoAutenticacaoCliente
          destino={destino}
          iniciarCadastro={parametros.modo === "criar"}
          recuperacaoConcluida={parametros.recuperacao === "concluida"}
        />
      </div>
    </main>
  );
}
