import { LogoAutenticacao } from "@/components/shared/logo-autenticacao";
import { FluxoAutenticacaoCliente } from "@/features/autenticacao/components/store/autenticacao/fluxo-autenticacao-cliente";
import { normalizarDestinoAutenticacao } from "@/features/autenticacao/lib/destino-autenticacao-cliente";

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
          {/* Mesma logo do cabeçalho da loja, vinda das configurações. */}
          <LogoAutenticacao />
          <p className="mt-2 text-sm text-slate-500">
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
