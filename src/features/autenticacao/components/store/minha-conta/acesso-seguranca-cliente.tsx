"use client";

import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

import { formatarTelefoneAutenticacaoCliente } from "../../../lib/apresentar-identidade-cliente";
import {
  mascararTelefoneCliente,
  normalizarTelefoneBrasileiroAmigavel,
} from "../../../lib/normalizar-identificador-cliente";
import type { AcessoSegurancaCliente } from "../../../queries/acesso-seguranca/buscar-acesso-seguranca-cliente";
import { CampoSenha } from "../autenticacao/campo-senha";

type EtapaAlteracao = "fechado" | "numero" | "codigo" | "reautenticar";

class ErroEndpoint extends Error {
  constructor(public readonly codigo: string) {
    super(codigo);
  }
}

async function chamarEndpoint(caminho: string, corpo: Record<string, string>) {
  const resposta = await fetch(`/api/auth${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (resposta.ok) return;
  const dados = (await resposta.json().catch(() => null)) as {
    message?: unknown;
  } | null;
  throw new ErroEndpoint(
    typeof dados?.message === "string" ? dados.message : "FALHA_TEMPORARIA",
  );
}

export function AcessoSegurancaCliente({
  acesso,
  sessaoRecenteInicial,
}: {
  acesso: AcessoSegurancaCliente;
  sessaoRecenteInicial: boolean;
}) {
  const [etapa, setEtapa] = useState<EtapaAlteracao>("fechado");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [telefoneAtual, setTelefoneAtual] = useState(acesso.telefone);
  const [telefoneVerificado, setTelefoneVerificado] = useState(
    acesso.telefoneVerificado,
  );
  const [telefoneCanonico, setTelefoneCanonico] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
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

  function iniciarAlteracao() {
    setErro(null);
    setMensagem(null);
    setEtapa(sessaoRecente ? "numero" : "reautenticar");
  }

  async function reautenticarSenha(evento: FormEvent) {
    evento.preventDefault();
    if (processando) return;
    setErro(null);
    setProcessando(true);
    try {
      await chamarEndpoint("/telefone/vinculo/reautenticar-senha", {
        password: senha,
      });
      setSenha("");
      setSessaoRecente(true);
      setEtapa("numero");
      setMensagem("Identidade confirmada. Informe o novo WhatsApp.");
    } catch {
      setErro("Não foi possível confirmar sua senha. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function reautenticarGoogle() {
    if (processando) return;
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

  async function solicitarCodigo(evento?: FormEvent) {
    evento?.preventDefault();
    if (processando) return;
    const normalizado = normalizarTelefoneBrasileiroAmigavel(novoTelefone);
    if (!normalizado) {
      setErro("Informe um WhatsApp brasileiro válido.");
      return;
    }
    setErro(null);
    setMensagem(null);
    setProcessando(true);
    try {
      await chamarEndpoint("/telefone/vinculo/solicitar", {
        phoneNumber: normalizado,
      });
      setTelefoneCanonico(normalizado);
      setSegundosReenvio(60);
      setEtapa("codigo");
    } catch {
      setErro(
        "Não foi possível enviar o código agora. Aguarde e tente novamente.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarCodigo(evento: FormEvent) {
    evento.preventDefault();
    if (!telefoneCanonico || processando) return;
    if (!/^[0-9]{6}$/.test(codigo)) {
      setErro("Informe o código de 6 dígitos recebido.");
      return;
    }
    setErro(null);
    setProcessando(true);
    try {
      await chamarEndpoint("/telefone/vinculo/confirmar", {
        phoneNumber: telefoneCanonico,
        code: codigo,
      });
      setTelefoneAtual(telefoneCanonico);
      setTelefoneVerificado(true);
      setNovoTelefone("");
      setCodigo("");
      setMensagem("WhatsApp alterado e verificado com sucesso.");
      setEtapa("fechado");
    } catch (erroCapturado) {
      if (
        erroCapturado instanceof ErroEndpoint &&
        erroCapturado.codigo === "REAUTENTICACAO_NECESSARIA"
      ) {
        setSessaoRecente(false);
        setEtapa("reautenticar");
        setErro("Confirme novamente sua identidade para concluir a alteração.");
      } else {
        setErro(
          "Não foi possível usar este número. Verifique o código ou utilize outro WhatsApp.",
        );
      }
    } finally {
      setProcessando(false);
    }
  }

  async function reenviarCodigo() {
    if (!telefoneCanonico || processando || segundosReenvio > 0) return;
    setNovoTelefone(telefoneCanonico);
    await solicitarCodigo();
  }

  return (
    <section
      className="mt-6 rounded-lg border bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="titulo-acesso-seguranca"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-[#0C447C]">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2
            id="titulo-acesso-seguranca"
            className="text-lg font-semibold text-slate-950"
          >
            Acesso e segurança
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Gerencie os identificadores usados para entrar na sua conta.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
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
              : "A adição segura será habilitada junto da verificação de e-mail."}
          </p>
          {!acesso.email ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled
            >
              Adicionar e-mail
            </Button>
          ) : null}
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <MessageCircle className="size-4" /> WhatsApp
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {telefoneAtual
              ? formatarTelefoneAutenticacaoCliente(telefoneAtual)
              : "WhatsApp não adicionado"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            {telefoneVerificado ? (
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            ) : null}
            {telefoneVerificado
              ? "WhatsApp verificado"
              : "WhatsApp não verificado"}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={iniciarAlteracao}
            disabled={processando}
          >
            Alterar WhatsApp
          </Button>
        </div>
      </div>

      <div aria-live="polite" className="mt-4">
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

      {etapa === "reautenticar" ? (
        <div className="mt-4 rounded-lg border bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-950">
            Confirme sua identidade
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Esta alteração exige uma autenticação recente.
          </p>
          {acesso.possuiSenha ? (
            <form onSubmit={reautenticarSenha} className="mt-4 space-y-3">
              <CampoSenha
                id="senha-reautenticacao-whatsapp"
                label="Senha atual"
                value={senha}
                onChange={setSenha}
                autoComplete="current-password"
                disabled={processando}
              />
              <Button type="submit" disabled={processando}>
                {processando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}{" "}
                Confirmar com senha
              </Button>
            </form>
          ) : null}
          {acesso.possuiGoogle ? (
            <Button
              type="button"
              variant={acesso.possuiSenha ? "outline" : "default"}
              className="mt-3"
              onClick={reautenticarGoogle}
              disabled={processando}
            >
              Confirmar com Google
            </Button>
          ) : null}
        </div>
      ) : null}

      {etapa === "numero" ? (
        <form
          onSubmit={solicitarCodigo}
          className="mt-4 space-y-3 rounded-lg border bg-slate-50 p-4"
        >
          <label
            htmlFor="novo-whatsapp"
            className="text-sm font-medium text-slate-800"
          >
            Novo WhatsApp
          </label>
          <Input
            id="novo-whatsapp"
            value={novoTelefone}
            onChange={(evento) => setNovoTelefone(evento.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="(31) 99999-9999"
            disabled={processando}
            required
          />
          <Button type="submit" disabled={processando}>
            {processando ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
            Enviar código
          </Button>
        </form>
      ) : null}

      {etapa === "codigo" && telefoneCanonico ? (
        <form
          onSubmit={confirmarCodigo}
          className="mt-4 space-y-3 rounded-lg border bg-slate-50 p-4"
        >
          <p className="text-sm text-slate-600">
            Código enviado para {mascararTelefoneCliente(telefoneCanonico)}
          </p>
          <label
            htmlFor="codigo-alteracao-whatsapp"
            className="text-sm font-medium text-slate-800"
          >
            Código de 6 dígitos
          </label>
          <Input
            id="codigo-alteracao-whatsapp"
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={processando}>
              {processando ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
              Confirmar alteração
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={reenviarCodigo}
              disabled={processando || segundosReenvio > 0}
            >
              {segundosReenvio > 0
                ? `Reenviar em ${segundosReenvio}s`
                : "Reenviar código"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
