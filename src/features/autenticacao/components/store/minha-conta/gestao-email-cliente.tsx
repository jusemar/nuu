"use client";

import { Loader2, Mail } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

import type { AcessoSegurancaCliente } from "../../../queries/acesso-seguranca/buscar-acesso-seguranca-cliente";
import { CampoSenha } from "../autenticacao/campo-senha";

type EtapaEmail = "fechado" | "email" | "reautenticar" | "codigo-whatsapp";

class ErroEmail extends Error {
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
  throw new ErroEmail(
    typeof dados?.message === "string" ? dados.message : "FALHA_TEMPORARIA",
  );
}

export function GestaoEmailCliente({
  acesso,
  sessaoRecenteInicial,
}: {
  acesso: AcessoSegurancaCliente;
  sessaoRecenteInicial: boolean;
}) {
  const [etapa, setEtapa] = useState<EtapaEmail>("fechado");
  const [novoEmail, setNovoEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [sessaoRecente, setSessaoRecente] = useState(sessaoRecenteInicial);
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const temporizador = window.setInterval(
      () => setSegundosReenvio((atual) => Math.max(0, atual - 1)),
      1_000,
    );
    return () => window.clearInterval(temporizador);
  }, [segundosReenvio]);

  function iniciar() {
    setErro(null);
    setMensagem(null);
    setEtapa(sessaoRecente ? "email" : "reautenticar");
  }

  async function solicitar(evento?: FormEvent) {
    evento?.preventDefault();
    if (processando) return;
    setErro(null);
    setProcessando(true);
    try {
      await chamar("/cliente/email/solicitar-confirmacao", {
        email: novoEmail,
      });
      setMensagem(
        "Enviamos um link para confirmar o novo endereço. Seu e-mail atual permanece válido até a confirmação.",
      );
      setSegundosReenvio(60);
    } catch (erroCapturado) {
      if (
        erroCapturado instanceof ErroEmail &&
        erroCapturado.codigo === "REAUTENTICACAO_NECESSARIA"
      ) {
        setSessaoRecente(false);
        setEtapa("reautenticar");
        setErro("Confirme sua identidade antes de alterar o e-mail.");
      } else if (
        erroCapturado instanceof ErroEmail &&
        erroCapturado.codigo === "EMAIL_INDISPONIVEL"
      ) {
        setErro(
          "Este endereço não pode ser utilizado. Revise ou informe outro e-mail.",
        );
      } else if (
        erroCapturado instanceof ErroEmail &&
        ["AGUARDE_REENVIO", "LIMITE_SOLICITACOES"].includes(
          erroCapturado.codigo,
        )
      ) {
        setErro("Aguarde alguns minutos antes de solicitar outro envio.");
      } else {
        setErro(
          "Não foi possível enviar a confirmação agora. Tente novamente.",
        );
      }
    } finally {
      setProcessando(false);
    }
  }

  async function reautenticarSenha(evento: FormEvent) {
    evento.preventDefault();
    if (processando) return;
    setErro(null);
    setProcessando(true);
    try {
      await chamar("/telefone/vinculo/reautenticar-senha", { password: senha });
      setSenha("");
      setSessaoRecente(true);
      setEtapa("email");
      setMensagem("Identidade confirmada. Informe o novo e-mail.");
    } catch {
      setErro("Não foi possível confirmar sua senha.");
    } finally {
      setProcessando(false);
    }
  }

  async function reautenticarGoogle() {
    setProcessando(true);
    setErro(null);
    try {
      const resultado = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/minha-conta",
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
      setErro("Não foi possível enviar o código pelo WhatsApp agora.");
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
      setSessaoRecente(true);
      setEtapa("email");
      setMensagem("Identidade confirmada. Informe o novo e-mail.");
    } catch {
      setErro(
        "O código está incorreto, expirou ou atingiu o limite de tentativas.",
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <Mail className="size-4" /> E-mail
      </div>
      <p className="mt-2 text-sm break-words text-slate-700">
        {acesso.email ?? "E-mail não adicionado"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {acesso.email
          ? acesso.emailVerificado
            ? "E-mail verificado"
            : "E-mail não verificado"
          : "Adicione um endereço real e confirme sua posse."}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={iniciar}
        disabled={processando}
      >
        {acesso.email ? "Alterar e-mail" : "Adicionar e-mail"}
      </Button>

      <div aria-live="polite" className="mt-3">
        {mensagem ? (
          <p
            role="status"
            className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {mensagem}
          </p>
        ) : null}
        {erro ? (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {erro}
          </p>
        ) : null}
      </div>

      {etapa === "email" ? (
        <form onSubmit={solicitar} className="mt-3 space-y-3">
          <label
            htmlFor="novo-email-cliente"
            className="text-sm font-medium text-slate-800"
          >
            Novo e-mail
          </label>
          <Input
            id="novo-email-cliente"
            type="email"
            value={novoEmail}
            onChange={(evento) => setNovoEmail(evento.target.value)}
            autoComplete="email"
            disabled={processando}
            required
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={processando}>
              {processando ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
              Enviar confirmação
            </Button>
            {segundosReenvio > 0 || mensagem ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => solicitar()}
                disabled={processando || segundosReenvio > 0}
              >
                {segundosReenvio > 0
                  ? `Reenviar em ${segundosReenvio}s`
                  : "Reenviar confirmação"}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {etapa === "reautenticar" ? (
        <div className="mt-3 space-y-3 rounded-md bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-800">
            Confirme sua identidade
          </p>
          {acesso.possuiSenha ? (
            <form onSubmit={reautenticarSenha} className="space-y-2">
              <CampoSenha
                id="senha-reautenticacao-email"
                label="Senha atual"
                value={senha}
                onChange={setSenha}
                autoComplete="current-password"
                disabled={processando}
              />
              <Button type="submit" disabled={processando}>
                Confirmar com senha
              </Button>
            </form>
          ) : null}
          {acesso.possuiGoogle ? (
            <Button
              type="button"
              variant="outline"
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
              onClick={solicitarWhatsapp}
              disabled={processando}
            >
              Confirmar com WhatsApp
            </Button>
          ) : null}
        </div>
      ) : null}

      {etapa === "codigo-whatsapp" ? (
        <form
          onSubmit={confirmarWhatsapp}
          className="mt-3 space-y-2 rounded-md bg-slate-50 p-3"
        >
          <label
            htmlFor="codigo-reautenticacao-email"
            className="text-sm font-medium text-slate-800"
          >
            Código de 6 dígitos
          </label>
          <Input
            id="codigo-reautenticacao-email"
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
          <Button type="submit" disabled={processando}>
            Confirmar código
          </Button>
        </form>
      ) : null}
    </div>
  );
}
