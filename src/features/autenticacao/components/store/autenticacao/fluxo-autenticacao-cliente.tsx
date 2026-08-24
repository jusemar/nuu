"use client";

import { ArrowLeft, Chrome, Loader2, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

import { criarDestinoPosAutenticacao } from "../../../lib/destino-autenticacao-cliente";
import {
  mascararTelefoneCliente,
  normalizarIdentificadorCliente,
  normalizarTelefoneBrasileiroAmigavel,
} from "../../../lib/normalizar-identificador-cliente";
import { CampoSenha } from "./campo-senha";

const MENSAGEM_LOGIN_NEUTRA = "E-mail, WhatsApp ou senha inválidos.";

type Tela =
  | "entrar"
  | "escolher-cadastro"
  | "cadastro-email"
  | "cadastro-whatsapp";

async function chamarEndpoint(caminho: string, corpo: Record<string, string>) {
  const resposta = await fetch(`/api/auth${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) throw new Error("OPERACAO_NAO_CONCLUIDA");
}

export function FluxoAutenticacaoCliente({
  destino,
  iniciarCadastro = false,
  recuperacaoConcluida = false,
}: {
  destino: string;
  iniciarCadastro?: boolean;
  recuperacaoConcluida?: boolean;
}) {
  const router = useRouter();
  const [tela, setTela] = useState<Tela>(
    iniciarCadastro ? "escolher-cadastro" : "entrar",
  );
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [telefoneCanonico, setTelefoneCanonico] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [segundosReenvio, setSegundosReenvio] = useState(0);

  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const temporizador = window.setInterval(
      () => setSegundosReenvio((atual) => Math.max(0, atual - 1)),
      1_000,
    );
    return () => window.clearInterval(temporizador);
  }, [segundosReenvio]);

  const destinoDepoisLogin = criarDestinoPosAutenticacao(destino);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    const normalizado = normalizarIdentificadorCliente(identificador);
    if (!normalizado) {
      setErro(MENSAGEM_LOGIN_NEUTRA);
      return;
    }
    setProcessando(true);
    try {
      if (normalizado.tipo === "email") {
        const resultado = await authClient.signIn.email({
          email: normalizado.valor,
          password: senha,
        });
        if (resultado.error) throw new Error("LOGIN_INVALIDO");
      } else {
        await chamarEndpoint("/telefone/entrar", {
          phoneNumber: normalizado.valor,
          password: senha,
        });
      }
      router.replace(destinoDepoisLogin);
      router.refresh();
    } catch {
      setErro(MENSAGEM_LOGIN_NEUTRA);
    } finally {
      setProcessando(false);
    }
  }

  async function entrarGoogle() {
    setErro(null);
    setProcessando(true);
    try {
      const resultado = await authClient.signIn.social({
        provider: "google",
        callbackURL: destinoDepoisLogin,
      });
      if ("error" in resultado && resultado.error) throw new Error();
    } catch {
      setErro("Não foi possível iniciar o acesso com Google.");
      setProcessando(false);
    }
  }

  async function cadastrarEmail(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    if (senha !== confirmacaoSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setProcessando(true);
    try {
      const resultado = await authClient.signUp.email({
        name: nome.trim(),
        email: email.trim().toLowerCase(),
        password: senha,
      });
      if (resultado.error) throw new Error();
      router.replace(destinoDepoisLogin);
      router.refresh();
    } catch {
      setErro(
        "Não foi possível criar a conta. Revise os dados ou tente entrar.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function solicitarCodigo() {
    const normalizado = normalizarTelefoneBrasileiroAmigavel(telefone);
    if (!normalizado) {
      setErro("Informe um WhatsApp brasileiro válido.");
      return;
    }
    setErro(null);
    setProcessando(true);
    try {
      await chamarEndpoint("/telefone/cadastro/solicitar", {
        phoneNumber: normalizado,
      });
      setTelefoneCanonico(normalizado);
      setSegundosReenvio(60);
    } catch {
      setErro(
        "Não foi possível enviar o código agora. Tente novamente mais tarde.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function concluirCadastroWhatsapp(evento: FormEvent) {
    evento.preventDefault();
    if (!telefoneCanonico || codigo.length !== 6) {
      setErro("Informe o código de 6 dígitos recebido.");
      return;
    }
    if (senha !== confirmacaoSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setErro(null);
    setProcessando(true);
    try {
      await chamarEndpoint("/telefone/cadastro/concluir", {
        phoneNumber: telefoneCanonico,
        code: codigo,
        name: nome,
        password: senha,
        passwordConfirmation: confirmacaoSenha,
      });
      router.replace(destinoDepoisLogin);
      router.refresh();
    } catch {
      setErro(
        "Não foi possível confirmar o código. Ele pode estar incorreto, expirado ou bloqueado.",
      );
    } finally {
      setProcessando(false);
    }
  }

  function voltar() {
    setErro(null);
    setTela(tela === "entrar" ? "entrar" : "escolher-cadastro");
  }

  return (
    <Card className="w-full border-slate-200 shadow-lg shadow-slate-200/50">
      <CardHeader className="space-y-2 pb-4 text-center">
        {tela !== "entrar" && tela !== "escolher-cadastro" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={voltar}
            className="w-fit px-0 text-slate-600"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        ) : null}
        <CardTitle className="text-2xl">
          {tela === "entrar" ? "Entrar" : "Criar conta"}
        </CardTitle>
        <p className="text-sm text-slate-500">
          {tela === "entrar"
            ? "Acesse pedidos, benefícios e seus dados."
            : "Escolha a forma mais conveniente para você."}
        </p>
      </CardHeader>
      <CardContent>
        {recuperacaoConcluida ? (
          <p
            role="status"
            className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            Senha redefinida com sucesso. Entre novamente com sua nova senha.
          </p>
        ) : null}
        {tela === "entrar" ? (
          <form onSubmit={entrar} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="identificador"
                className="text-sm font-medium text-slate-800"
              >
                E-mail ou WhatsApp
              </label>
              <Input
                id="identificador"
                value={identificador}
                onChange={(evento) => setIdentificador(evento.target.value)}
                autoComplete="username"
                placeholder="voce@email.com ou (31) 99999-9999"
                required
              />
            </div>
            <CampoSenha
              id="senha-login"
              label="Senha"
              value={senha}
              onChange={setSenha}
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <Link
                href="/authentication/recuperar"
                className="text-sm font-medium text-[#0C447C] underline-offset-4 hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Button type="submit" disabled={processando} className="w-full">
              {processando ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
              Entrar
            </Button>
          </form>
        ) : null}

        {tela === "escolher-cadastro" ? (
          <div className="space-y-3">
            <p className="pb-1 text-center text-sm font-medium text-slate-700">
              Como deseja criar sua conta?
            </p>
            <Button
              className="w-full"
              onClick={() => setTela("cadastro-whatsapp")}
            >
              <MessageCircle className="size-4" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setTela("cadastro-email")}
            >
              <Mail className="size-4" /> E-mail
            </Button>
          </div>
        ) : null}

        {tela === "cadastro-email" ? (
          <form onSubmit={cadastrarEmail} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium text-slate-800">
              Nome{" "}
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-slate-800">
              E-mail{" "}
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <CampoSenha
              id="senha-email"
              label="Senha"
              value={senha}
              onChange={setSenha}
              autoComplete="new-password"
            />
            <CampoSenha
              id="confirmar-email"
              label="Confirmar senha"
              value={confirmacaoSenha}
              onChange={setConfirmacaoSenha}
              autoComplete="new-password"
            />
            <Button type="submit" disabled={processando} className="w-full">
              {processando ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
              Criar conta
            </Button>
          </form>
        ) : null}

        {tela === "cadastro-whatsapp" ? (
          <form onSubmit={concluirCadastroWhatsapp} className="space-y-4">
            {!telefoneCanonico ? (
              <>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">
                  WhatsApp
                  <Input
                    inputMode="tel"
                    autoComplete="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(31) 99999-9999"
                    required
                  />
                </label>
                <Button
                  type="button"
                  onClick={solicitarCodigo}
                  disabled={processando}
                  className="w-full"
                >
                  {processando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}{" "}
                  Enviar código
                </Button>
              </>
            ) : (
              <>
                <p
                  className="rounded-md bg-blue-50 p-3 text-sm text-[#0C447C]"
                  aria-live="polite"
                >
                  Enviamos um código para{" "}
                  {mascararTelefoneCliente(telefoneCanonico)}.
                </p>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">
                  Código de 6 dígitos
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) =>
                      setCodigo(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={solicitarCodigo}
                  disabled={processando || segundosReenvio > 0}
                  className="w-full"
                >
                  {segundosReenvio > 0
                    ? `Reenviar em ${segundosReenvio}s`
                    : "Reenviar código"}
                </Button>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">
                  Nome{" "}
                  <Input
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </label>
                <CampoSenha
                  id="senha-whatsapp"
                  label="Senha"
                  value={senha}
                  onChange={setSenha}
                  autoComplete="new-password"
                />
                <CampoSenha
                  id="confirmar-whatsapp"
                  label="Confirmar senha"
                  value={confirmacaoSenha}
                  onChange={setConfirmacaoSenha}
                  autoComplete="new-password"
                />
                <Button type="submit" disabled={processando} className="w-full">
                  {processando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}{" "}
                  Confirmar e criar conta
                </Button>
              </>
            )}
          </form>
        ) : null}

        {erro ? (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-4 text-sm text-rose-700"
          >
            {erro}
          </p>
        ) : null}

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
          ou
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={entrarGoogle}
          disabled={processando}
          className="w-full"
        >
          <Chrome className="size-4" /> Continuar com Google
        </Button>
        <button
          type="button"
          onClick={() => {
            setErro(null);
            setTela(tela === "entrar" ? "escolher-cadastro" : "entrar");
          }}
          className="mt-5 w-full text-center text-sm font-medium text-[#0C447C] hover:underline"
        >
          {tela === "entrar"
            ? "Ainda não tem conta? Criar conta"
            : "Já tem conta? Entrar"}
        </button>
      </CardContent>
    </Card>
  );
}
