import { Header } from "@/features/header";

import type { CadastroClienteCompleto } from "../../../types/cadastro-cliente.types";
import type { SessaoClienteAutenticado } from "../../../types/sessao-cliente.types";
import { FormularioCompletarCadastro } from "./formulario-completar-cadastro";

export function PaginaCompletarCadastro({
  sessao,
  cadastro,
}: {
  sessao: SessaoClienteAutenticado;
  cadastro: CadastroClienteCompleto;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#0C447C]">Minha Conta</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Completar cadastro
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Informe os dados necessários para compras, entregas e futuras
              emissões da loja.
            </p>
          </div>

          <FormularioCompletarCadastro sessao={sessao} cadastro={cadastro} />
        </div>
      </main>
    </>
  );
}
