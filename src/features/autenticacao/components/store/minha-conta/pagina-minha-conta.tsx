import Link from "next/link";
import { PackageSearch, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/features/header";

import type { CadastroClienteCompleto } from "../../../types/cadastro-cliente.types";
import type { SessaoClienteAutenticado } from "../../../types/sessao-cliente.types";
import { FormularioCompletarCadastro } from "../completar-cadastro/formulario-completar-cadastro";

function formatarDataConta(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function PaginaMinhaConta({
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
          <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="border-b bg-gradient-to-r from-[#0C447C] to-[#17639f] px-6 py-8 text-white">
              <p className="text-sm font-medium text-blue-100">Minha Conta</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Olá, {sessao.usuario.nome}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-blue-50">
                Esta é sua área para acompanhar os dados básicos da conta e seus
                pedidos na loja.
              </p>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center rounded-lg border bg-slate-50 p-5 text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                  {sessao.usuario.imagem ? (
                    <img
                      src={sessao.usuario.imagem}
                      alt={sessao.usuario.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-10 w-10 text-slate-500" />
                  )}
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">
                  {sessao.usuario.nome}
                </p>
                <p className="mt-1 max-w-full truncate text-xs text-slate-500">
                  {sessao.usuario.email}
                </p>
              </div>

              <div className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      Nome
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">
                      {sessao.usuario.nome}
                    </dd>
                  </div>
                  <div className="rounded-lg border p-4">
                    <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      Email
                    </dt>
                    <dd className="mt-1 text-sm font-semibold break-words text-slate-950">
                      {sessao.usuario.email}
                    </dd>
                  </div>
                  <div className="rounded-lg border p-4 sm:col-span-2">
                    <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      Conta criada em
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">
                      {formatarDataConta(sessao.usuario.criadoEm)}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">
                      Acompanhe suas compras
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Veja status, pagamento e rastreio dos seus pedidos.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/minha-conta/pedidos">
                      <PackageSearch className="h-4 w-4" />
                      Meus pedidos
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Cadastro e endereço
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Atualize seus dados, endereço principal e preferências de
                entrega.
              </p>
            </div>
            <FormularioCompletarCadastro
              cadastro={cadastro}
              modo="editar"
              sessao={sessao}
            />
          </section>
        </div>
      </main>
    </>
  );
}
