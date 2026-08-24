"use client";

import { ArrowLeft, Loader2, MailCheck, MessageCircle } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

import {
  mascararTelefoneCliente,
  normalizarIdentificadorCliente,
} from "../../../lib/normalizar-identificador-cliente";
import { CampoSenha } from "../autenticacao/campo-senha";

const MENSAGEM_NEUTRA =
  "Se encontrarmos uma conta compatível, enviaremos as instruções de recuperação.";

async function chamarEndpoint(caminho: string, corpo: Record<string, string>) {
  const resposta = await fetch(`/api/auth${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) {
    const dados = (await resposta.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    throw new Error(
      typeof dados?.message === "string"
        ? dados.message
        : "OPERACAO_NAO_CONCLUIDA",
    );
  }
}

function mensagemErroOtp(erro: unknown) {
  if (erro instanceof Error && erro.message === "CODIGO_INCORRETO")
    return "O código informado está incorreto.";
  if (erro instanceof Error && erro.message === "CODIGO_EXPIRADO")
    return "Este código expirou. Solicite um novo código.";
  if (erro instanceof Error && erro.message === "TENTATIVAS_ESGOTADAS")
    return "O limite de tentativas foi atingido. Solicite um novo código mais tarde.";
  return "O código é inválido ou já foi utilizado. Solicite um novo código.";
}

type Etapa = "identificador" | "email-enviado" | "codigo" | "nova-senha";

export function PaginaRecuperacaoAcesso() {
  const [etapa, setEtapa] = useState<Etapa>("identificador");
  const [identificador, setIdentificador] = useState("");
  const [telefone, setTelefone] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const temporizador = window.setInterval(
      () => setSegundosReenvio((atual) => Math.max(0, atual - 1)),
      1_000,
    );
    return () => window.clearInterval(temporizador);
  }, [segundosReenvio]);

  async function solicitar(evento: FormEvent) {
    evento.preventDefault();
    if (processando) return;
    const normalizado = normalizarIdentificadorCliente(identificador);
    if (!normalizado) {
      setErro("Informe um e-mail ou WhatsApp válido.");
      return;
    }

    setErro(null);
    setProcessando(true);
    try {
      if (normalizado.tipo === "email") {
        await authClient.requestPasswordReset({
          email: normalizado.valor,
          redirectTo: `${window.location.origin}/authentication/recuperar/redefinir`,
        });
        setEtapa("email-enviado");
      } else {
        await chamarEndpoint("/telefone/recuperacao/solicitar", {
          phoneNumber: normalizado.valor,
        });
        setTelefone(normalizado.valor);
        setSegundosReenvio(60);
        setEtapa("codigo");
      }
    } catch {
      // A mesma resposta externa é usada para contas existentes e inexistentes.
      if (normalizado.tipo === "email") setEtapa("email-enviado");
      else
        setErro(
          "Não foi possível processar agora. Aguarde alguns minutos e tente novamente.",
        );
    } finally {
      setProcessando(false);
    }
  }

  function continuarComCodigo(evento: FormEvent) {
    evento.preventDefault();
    if (!/^[0-9]{6}$/.test(codigo)) {
      setErro("Informe o código de 6 dígitos recebido.");
      return;
    }
    setErro(null);
    setEtapa("nova-senha");
  }

  async function redefinirPorWhatsapp(evento: FormEvent) {
    evento.preventDefault();
    if (!telefone || processando) return;
    if (novaSenha !== confirmacaoSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setErro(null);
    setProcessando(true);
    try {
      await chamarEndpoint("/telefone/recuperacao/redefinir", {
        phoneNumber: telefone,
        code: codigo,
        newPassword: novaSenha,
      });
      window.location.assign("/authentication?recuperacao=concluida");
    } catch (erroCapturado) {
      setErro(mensagemErroOtp(erroCapturado));
    } finally {
      setProcessando(false);
    }
  }

  async function reenviar() {
    if (!telefone || processando || segundosReenvio > 0) return;
    setErro(null);
    setProcessando(true);
    try {
      await chamarEndpoint("/telefone/recuperacao/solicitar", {
        phoneNumber: telefone,
      });
      setSegundosReenvio(60);
    } catch {
      setErro("Não foi possível reenviar agora. Aguarde e tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  const titulo =
    etapa === "identificador" ? "Recuperar acesso" : "Confira suas instruções";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <Link
          href="/authentication"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="size-4" /> Voltar para entrar
        </Link>
        <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">{titulo}</CardTitle>
            <p className="text-sm text-slate-500">
              {etapa === "identificador"
                ? "Informe o e-mail ou WhatsApp usado na sua conta."
                : MENSAGEM_NEUTRA}
            </p>
          </CardHeader>
          <CardContent>
            {erro ? (
              <p
                role="alert"
                className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
              >
                {erro}
              </p>
            ) : null}

            {etapa === "identificador" ? (
              <form onSubmit={solicitar} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="identificador-recuperacao"
                    className="text-sm font-medium text-slate-800"
                  >
                    E-mail ou WhatsApp
                  </label>
                  <Input
                    id="identificador-recuperacao"
                    value={identificador}
                    onChange={(evento) => setIdentificador(evento.target.value)}
                    autoComplete="username"
                    placeholder="voce@email.com ou (31) 99999-9999"
                    disabled={processando}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={processando}>
                  {processando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Continuar
                </Button>
              </form>
            ) : null}

            {etapa === "email-enviado" ? (
              <div
                role="status"
                className="space-y-4 text-center text-sm text-slate-600"
              >
                <MailCheck className="mx-auto size-9 text-[#0C447C]" />
                <p>{MENSAGEM_NEUTRA}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/authentication">Voltar para entrar</Link>
                </Button>
              </div>
            ) : null}

            {etapa === "codigo" && telefone ? (
              <form onSubmit={continuarComCodigo} className="space-y-4">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-2 size-8 text-emerald-600" />
                  <p className="text-sm text-slate-600">
                    Código enviado para {mascararTelefoneCliente(telefone)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="codigo-recuperacao"
                    className="text-sm font-medium text-slate-800"
                  >
                    Código de 6 dígitos
                  </label>
                  <Input
                    id="codigo-recuperacao"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={codigo}
                    onChange={(evento) =>
                      setCodigo(
                        evento.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    maxLength={6}
                    disabled={processando}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={processando}>
                  Continuar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={reenviar}
                  disabled={processando || segundosReenvio > 0}
                >
                  {segundosReenvio > 0
                    ? `Reenviar em ${segundosReenvio}s`
                    : "Reenviar código"}
                </Button>
              </form>
            ) : null}

            {etapa === "nova-senha" ? (
              <form onSubmit={redefinirPorWhatsapp} className="space-y-4">
                <CampoSenha
                  id="nova-senha-whatsapp"
                  label="Nova senha"
                  value={novaSenha}
                  onChange={setNovaSenha}
                  autoComplete="new-password"
                  disabled={processando}
                />
                <CampoSenha
                  id="confirmar-senha-whatsapp"
                  label="Confirmar nova senha"
                  value={confirmacaoSenha}
                  onChange={setConfirmacaoSenha}
                  autoComplete="new-password"
                  disabled={processando}
                />
                <Button type="submit" className="w-full" disabled={processando}>
                  {processando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Redefinir senha
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
