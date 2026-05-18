"use client";

import { useMemo, useState } from "react";

import { clienteAutenticacao } from "../lib/cliente-autenticacao";
import { mapearSessaoCliente } from "../lib/mapear-sessao-cliente";

export function useAutenticacaoCliente() {
  const { data, isPending, refetch } = clienteAutenticacao.useSession();
  const [entrandoComGoogle, setEntrandoComGoogle] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const sessao = useMemo(() => mapearSessaoCliente(data), [data]);

  async function entrarComGoogle() {
    setMensagemErro(null);
    setEntrandoComGoogle(true);

    try {
      const resultado = await clienteAutenticacao.signIn.social({
        provider: "google",
        callbackURL: "/completar-cadastro",
      });

      if ("error" in resultado && resultado.error) {
        setMensagemErro("Não foi possível iniciar o login com Google.");
        setEntrandoComGoogle(false);
      }
    } catch {
      setMensagemErro("Não foi possível iniciar o login com Google.");
      setEntrandoComGoogle(false);
    }
  }

  async function sair() {
    setMensagemErro(null);
    setSaindo(true);

    try {
      await clienteAutenticacao.signOut();
      await refetch();
    } catch {
      setMensagemErro("Não foi possível sair da conta.");
    } finally {
      setSaindo(false);
    }
  }

  return {
    sessao,
    autenticado: Boolean(sessao),
    carregandoSessao: isPending,
    entrandoComGoogle,
    saindo,
    mensagemErro,
    entrarComGoogle,
    sair,
  };
}
