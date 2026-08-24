"use client";

import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

import type { AcessoSegurancaCliente } from "../../../queries/acesso-seguranca/buscar-acesso-seguranca-cliente";
import { CampoSenha } from "../autenticacao/campo-senha";

type Etapa = "confirmar" | "reautenticar" | "codigo-whatsapp" | "concluido";

class ErroConfirmacao extends Error {
  constructor(public readonly codigo: string) {
    super(codigo);
  }
}

async function chamar(caminho: string, corpo: Record<string, string> = {}) {
  const resposta = await fetch(`/api/auth${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (resposta.ok) return;
  const dados = (await resposta.json().catch(() => null)) as {
    message?: unknown;
  } | null;
  throw new ErroConfirmacao(
    typeof dados?.message === "string" ? dados.message : "FALHA_TEMPORARIA",
  );
}

export function ConfirmacaoEmailCliente({
  token,
  acesso,
  sessaoRecenteInicial,
}: {
  token: string | null;
  acesso: AcessoSegurancaCliente;
  sessaoRecenteInicial: boolean;
}) {
  const [etapa, setEtapa] = useState<Etapa>(
    sessaoRecenteInicial ? "confirmar" : "reautenticar",
  );
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(
    token ? null : "Este link é inválido.",
  );

  async function confirmar() {
    if (!token || processando) return;
    setProcessando(true);
    setErro(null);
    try {
      await chamar("/cliente/email/confirmar", { token });
      setEtapa("concluido");
    } catch (erroCapturado) {
      if (
        erroCapturado instanceof ErroConfirmacao &&
        erroCapturado.codigo === "REAUTENTICACAO_NECESSARIA"
      ) {
        setEtapa("reautenticar");
        setErro("Confirme sua identidade para concluir a alteração.");
      } else if (
        erroCapturado instanceof ErroConfirmacao &&
        erroCapturado.codigo === "TOKEN_EXPIRADO"
      ) {
        setErro(
          "Este link expirou. Solicite uma nova confirmação em Minha Conta.",
        );
      } else if (
        erroCapturado instanceof ErroConfirmacao &&
        erroCapturado.codigo === "TOKEN_REUTILIZADO"
      ) {
        setErro(
          "Este link já foi utilizado. Confira seu e-mail atual em Minha Conta.",
        );
      } else if (
        erroCapturado instanceof ErroConfirmacao &&
        erroCapturado.codigo === "EMAIL_INDISPONIVEL"
      ) {
        setErro("Este endereço não pode mais ser utilizado.");
      } else {
        setErro("Este link é inválido ou não pôde ser confirmado.");
      }
    } finally {
      setProcessando(false);
    }
  }

  async function reautenticarSenha(evento: FormEvent) {
    evento.preventDefault();
    setProcessando(true);
    setErro(null);
    try {
      await chamar("/telefone/vinculo/reautenticar-senha", { password: senha });
      setSenha("");
      setEtapa("confirmar");
    } catch {
      setErro("Não foi possível confirmar sua senha.");
    } finally {
      setProcessando(false);
    }
  }

  async function reautenticarGoogle() {
    if (!token) return;
    setProcessando(true);
    const retorno = `/minha-conta/confirmar-email?token=${encodeURIComponent(token)}`;
    try {
      const resultado = await authClient.signIn.social({
        provider: "google",
        callbackURL: retorno,
      });
      if ("error" in resultado && resultado.error) throw new Error();
    } catch {
      setErro("Não foi possível iniciar a confirmação com Google.");
      setProcessando(false);
    }
  }

  async function solicitarWhatsapp() {
    setProcessando(true);
    setErro(null);
    try {
      await chamar("/cliente/reautenticar-whatsapp/solicitar");
      setEtapa("codigo-whatsapp");
    } catch {
      setErro("Não foi possível enviar o código pelo WhatsApp.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarWhatsapp(evento: FormEvent) {
    evento.preventDefault();
    setProcessando(true);
    setErro(null);
    try {
      await chamar("/cliente/reautenticar-whatsapp/confirmar", {
        code: codigo,
      });
      setCodigo("");
      setEtapa("confirmar");
    } catch {
      setErro(
        "O código está incorreto, expirou ou atingiu o limite de tentativas.",
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-slate-200 shadow-sm">
        <CardHeader className="text-center">
          <MailCheck className="mx-auto mb-2 size-9 text-[#0C447C]" />
          <CardTitle>Confirmar novo e-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {erro ? (
            <p
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-700"
            >
              {erro}
            </p>
          ) : null}
          {etapa === "confirmar" && token ? (
            <Button
              type="button"
              className="w-full"
              onClick={confirmar}
              disabled={processando}
            >
              {processando ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
              Confirmar e-mail
            </Button>
          ) : null}
          {etapa === "reautenticar" ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Por segurança, confirme novamente sua identidade.
              </p>
              {acesso.possuiSenha ? (
                <form onSubmit={reautenticarSenha} className="space-y-2">
                  <CampoSenha
                    id="senha-confirmacao-email"
                    label="Senha atual"
                    value={senha}
                    onChange={setSenha}
                    autoComplete="current-password"
                    disabled={processando}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={processando}
                  >
                    Confirmar com senha
                  </Button>
                </form>
              ) : null}
              {acesso.possuiGoogle ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={reautenticarGoogle}
                  disabled={processando}
                >
                  Confirmar com Google
                </Button>
              ) : null}
              {acesso.telefoneVerificado ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={solicitarWhatsapp}
                  disabled={processando}
                >
                  Confirmar com WhatsApp
                </Button>
              ) : null}
            </div>
          ) : null}
          {etapa === "codigo-whatsapp" ? (
            <form onSubmit={confirmarWhatsapp} className="space-y-3">
              <label
                htmlFor="codigo-confirmar-email"
                className="text-sm font-medium text-slate-800"
              >
                Código de 6 dígitos
              </label>
              <Input
                id="codigo-confirmar-email"
                value={codigo}
                onChange={(evento) =>
                  setCodigo(evento.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={processando}
                required
              />
              <Button type="submit" className="w-full" disabled={processando}>
                Confirmar código
              </Button>
            </form>
          ) : null}
          {etapa === "concluido" ? (
            <div role="status" className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                Novo e-mail confirmado com sucesso.
              </p>
              <Button asChild className="w-full">
                <Link href="/minha-conta">Voltar para Minha Conta</Link>
              </Button>
            </div>
          ) : null}
          {!token ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/minha-conta">Voltar para Minha Conta</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
