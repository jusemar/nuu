"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

import {
  mascararTelefoneCliente,
  normalizarTelefoneBrasileiroAmigavel,
} from "../../lib/normalizar-identificador-cliente";
import { CampoSenha } from "../store/autenticacao/campo-senha";

const formularioSchema = z.object({
  email: z.email("Informe um email válido."),
});

type DadosFormulario = z.infer<typeof formularioSchema>;
type MetodoRecuperacao = "email" | "whatsapp";
type EtapaWhatsapp = "telefone" | "codigo" | "senha" | "concluido";

const MENSAGEM_NEUTRA_EMAIL =
  "Se o email pertencer a uma conta administrativa autorizada, você receberá as instruções em instantes.";
const MENSAGEM_NEUTRA_WHATSAPP =
  "Se os dados informados forem elegíveis, você receberá um código pelo WhatsApp.";

async function chamarEndpoint(caminho: string, corpo: Record<string, string>) {
  const resposta = await fetch(`/api/auth${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) throw new Error("OPERACAO_NAO_CONCLUIDA");
}

export function PaginaSolicitarRecuperacaoSenha() {
  const [metodo, setMetodo] = useState<MetodoRecuperacao>("email");
  const [etapaWhatsapp, setEtapaWhatsapp] = useState<EtapaWhatsapp>("telefone");
  const [telefone, setTelefone] = useState("");
  const [telefoneCanonico, setTelefoneCanonico] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const formulario = useForm<DadosFormulario>({
    resolver: zodResolver(formularioSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const temporizador = window.setInterval(
      () => setSegundosReenvio((atual) => Math.max(0, atual - 1)),
      1_000,
    );
    return () => window.clearInterval(temporizador);
  }, [segundosReenvio]);

  function trocarMetodo(novoMetodo: MetodoRecuperacao) {
    setMetodo(novoMetodo);
    setErro(null);
    setMensagem(null);
  }

  async function solicitarRecuperacaoEmail(dados: DadosFormulario) {
    if (enviando) return;
    setEnviando(true);
    setMensagem(null);
    setErro(null);
    try {
      const resultado = await authClient.requestPasswordReset({
        email: dados.email,
        redirectTo: "/admin/redefinir-senha",
      });
      if (resultado.error?.status === 429) {
        setErro("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        return;
      }
      setMensagem(MENSAGEM_NEUTRA_EMAIL);
    } catch {
      setErro(
        "Não foi possível processar a solicitação agora. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function solicitarCodigo(evento?: FormEvent) {
    evento?.preventDefault();
    if (enviando) return;
    const normalizado = normalizarTelefoneBrasileiroAmigavel(
      telefoneCanonico ?? telefone,
    );
    if (!normalizado) {
      setErro("Informe um WhatsApp brasileiro válido.");
      return;
    }
    setEnviando(true);
    setErro(null);
    setMensagem(null);
    try {
      await chamarEndpoint("/admin/telefone/recuperacao/solicitar", {
        phoneNumber: normalizado,
      });
      setTelefoneCanonico(normalizado);
      setSegundosReenvio(60);
      setEtapaWhatsapp("codigo");
      setMensagem(MENSAGEM_NEUTRA_WHATSAPP);
    } catch {
      setErro("Não foi possível processar agora. Aguarde e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function continuarParaSenha(evento: FormEvent) {
    evento.preventDefault();
    if (!/^[0-9]{6}$/.test(codigo)) {
      setErro("Informe o código de 6 dígitos recebido.");
      return;
    }
    setErro(null);
    setMensagem(null);
    setEtapaWhatsapp("senha");
  }

  async function redefinirSenhaWhatsapp(evento: FormEvent) {
    evento.preventDefault();
    if (!telefoneCanonico || enviando) return;
    if (novaSenha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await chamarEndpoint("/admin/telefone/recuperacao/redefinir", {
        phoneNumber: telefoneCanonico,
        code: codigo,
        newPassword: novaSenha,
      });
      setEtapaWhatsapp("concluido");
      setMensagem(null);
      setCodigo("");
      setNovaSenha("");
      setConfirmacaoSenha("");
    } catch {
      setErro("O código é inválido, expirou ou já foi utilizado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              {metodo === "email" ? (
                <Mail className="h-5 w-5" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
            </div>
            <CardTitle className="text-xl">Recuperar acesso</CardTitle>
            <CardDescription>
              Escolha como deseja redefinir sua senha administrativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="mb-5 grid grid-cols-2 gap-2"
              role="group"
              aria-label="Método de recuperação"
            >
              <Button
                type="button"
                variant={metodo === "email" ? "default" : "outline"}
                onClick={() => trocarMetodo("email")}
                disabled={enviando}
              >
                E-mail
              </Button>
              <Button
                type="button"
                variant={metodo === "whatsapp" ? "default" : "outline"}
                onClick={() => trocarMetodo("whatsapp")}
                disabled={enviando}
              >
                WhatsApp
              </Button>
            </div>

            {mensagem ? (
              <p
                role="status"
                className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
              >
                {mensagem}
              </p>
            ) : null}
            {erro ? (
              <p
                role="alert"
                className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {erro}
              </p>
            ) : null}

            {metodo === "email" ? (
              <Form {...formulario}>
                <form
                  onSubmit={formulario.handleSubmit(solicitarRecuperacaoEmail)}
                  className="space-y-4"
                >
                  <FormField
                    control={formulario.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="seu@email.com"
                            disabled={enviando}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={enviando}>
                    {enviando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Enviar link de recuperação
                  </Button>
                </form>
              </Form>
            ) : null}

            {metodo === "whatsapp" && etapaWhatsapp === "telefone" ? (
              <form onSubmit={solicitarCodigo} className="space-y-4">
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">
                  WhatsApp
                  <Input
                    value={telefone}
                    onChange={(evento) => setTelefone(evento.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="(31) 99999-9999"
                    disabled={enviando}
                    required
                  />
                </label>
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Solicitar código
                </Button>
              </form>
            ) : null}

            {metodo === "whatsapp" &&
            etapaWhatsapp === "codigo" &&
            telefoneCanonico ? (
              <form onSubmit={continuarParaSenha} className="space-y-4">
                <p className="text-center text-sm text-slate-600">
                  Destino: {mascararTelefoneCliente(telefoneCanonico)}
                </p>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">
                  Código de 6 dígitos
                  <Input
                    value={codigo}
                    onChange={(evento) =>
                      setCodigo(
                        evento.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={enviando}
                    required
                  />
                </label>
                <Button type="submit" className="w-full" disabled={enviando}>
                  Continuar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => void solicitarCodigo()}
                  disabled={enviando || segundosReenvio > 0}
                >
                  {segundosReenvio > 0
                    ? `Reenviar em ${segundosReenvio}s`
                    : "Reenviar código"}
                </Button>
              </form>
            ) : null}

            {metodo === "whatsapp" && etapaWhatsapp === "senha" ? (
              <form onSubmit={redefinirSenhaWhatsapp} className="space-y-4">
                <CampoSenha
                  id="nova-senha-admin-whatsapp"
                  label="Nova senha"
                  value={novaSenha}
                  onChange={setNovaSenha}
                  autoComplete="new-password"
                  disabled={enviando}
                />
                <CampoSenha
                  id="confirmar-senha-admin-whatsapp"
                  label="Confirmar nova senha"
                  value={confirmacaoSenha}
                  onChange={setConfirmacaoSenha}
                  autoComplete="new-password"
                  disabled={enviando}
                />
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Redefinir senha
                </Button>
              </form>
            ) : null}

            {metodo === "whatsapp" && etapaWhatsapp === "concluido" ? (
              <div
                role="status"
                className="space-y-4 text-center text-sm text-emerald-800"
              >
                <p>Senha redefinida e WhatsApp verificado com sucesso.</p>
                <Button asChild className="w-full">
                  <Link href="/admin/login">Voltar ao login</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
