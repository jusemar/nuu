"use client";

import Link from "next/link";
import {
  Chrome,
  Loader2,
  LogOut,
  PackageSearch,
  User,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAutenticacaoCliente } from "../../hooks/use-autenticacao-cliente";

export function BotaoContaCliente() {
  const {
    sessao,
    autenticado,
    carregandoSessao,
    entrandoComGoogle,
    saindo,
    mensagemErro,
    entrarComGoogle,
    sair,
  } = useAutenticacaoCliente();

  if (carregandoSessao) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        className="rounded-full text-slate-500"
        aria-label="Carregando sessão"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!autenticado) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-600 hover:bg-blue-50 hover:text-[#0C447C]"
            aria-label="Abrir menu da conta"
          >
            {entrandoComGoogle ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-lg p-2">
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block text-sm font-semibold text-slate-950">
              Minha conta
            </span>
            <span className="mt-0.5 block text-xs font-normal text-slate-500">
              Entre para acompanhar sua experiência na loja.
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={entrarComGoogle}
            disabled={entrandoComGoogle}
            className="cursor-pointer py-2.5"
          >
            {entrandoComGoogle ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="h-4 w-4" />
            )}
            Entrar com Google
          </DropdownMenuItem>
          {mensagemErro && (
            <>
              <DropdownMenuSeparator />
              <p className="px-2 py-1.5 text-xs text-rose-700">
                {mensagemErro}
              </p>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full p-0 hover:bg-blue-50"
          aria-label="Abrir menu da conta"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {sessao?.usuario.imagem ? (
              <img
                src={sessao.usuario.imagem}
                alt={sessao.usuario.nome}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-[#0C447C]">
                {sessao?.usuario.nome?.slice(0, 1).toUpperCase() ?? "U"}
              </span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-lg p-2">
        <DropdownMenuLabel className="px-2 py-2">
          <span className="block truncate text-sm font-semibold text-slate-950">
            {sessao?.usuario.nome}
          </span>
          <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
            {sessao?.usuario.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer py-2.5">
          <Link href="/minha-conta">
            <User className="h-4 w-4" />
            Minha Conta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer py-2.5">
          <Link href="/minha-conta/pedidos">
            <PackageSearch className="h-4 w-4" />
            Meus pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={sair}
          disabled={saindo}
          className="cursor-pointer py-2.5 text-slate-700"
        >
          {saindo ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sair
        </DropdownMenuItem>
        {mensagemErro && (
          <>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-xs text-rose-700">{mensagemErro}</p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
