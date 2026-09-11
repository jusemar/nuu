"use client";

import {
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

import { aceitarConviteAdministrador } from "../../actions/aceitar-convite-administrador";
import type { EstadoConvitePublico } from "../../queries/validar-convite-publico";

type ConvitePublico = {
  emailMascarado?: string;
  estado: EstadoConvitePublico;
  nome?: string;
  telefoneMascarado?: string;
  tipoIdentificador?: "email" | "whatsapp";
};

type EtapaWhatsapp = "inicial" | "codigo" | "cadastro" | "aceite";
type RespostaEndpoint = Record<string, unknown>;

async function chamarEndpoint(
  caminho: string,
  corpo: Record<string, string>,
): Promise<RespostaEndpoint> {
  const resposta = await fetch(`/api/auth${caminho}`, {
    body: JSON.stringify(corpo),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const dados = (await resposta.json().catch(() => ({}))) as RespostaEndpoint;
  if (!resposta.ok) throw new Error("OPERACAO_NAO_CONCLUIDA");
  return dados;
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="text-muted-foreground text-sm">
      {children}
    </p>
  );
}

function BotaoSairConta({ processando }: { processando: boolean }) {
  async function sair() {
    await authClient.signOut();
    window.location.reload();
  }

  return (
    <Button
      className="w-full gap-2"
      disabled={processando}
      onClick={() => void sair()}
      type="button"
      variant="outline"
    >
      <LogOut className="size-4" aria-hidden="true" />
      Sair e continuar com a conta correta
    </Button>
  );
}

function ConteudoConvite({
  children,
  descricao,
  icone,
  titulo,
}: {
  children: React.ReactNode;
  descricao: React.ReactNode;
  icone: React.ReactNode;
  titulo: string;
}) {
  return (
    <main className="bg-muted/40 flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="bg-primary text-primary-foreground mx-auto flex size-11 items-center justify-center rounded-lg">
            {icone}
          </div>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
      </Card>
    </main>
  );
}

function PaginaConviteEmail({
  convite,
  token,
}: {
  convite: ConvitePublico;
  token: string;
}) {
  const { data: sessao, isPending: carregandoSessao } = authClient.useSession();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState(convite.nome ?? "");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [processando, setProcessando] = useState(false);
  const [identidadeDivergente, setIdentidadeDivergente] = useState(false);

  async function aceitar() {
    setProcessando(true);
    try {
      const resultado = await aceitarConviteAdministrador(token);
      if (!resultado.sucesso) {
        setIdentidadeDivergente(true);
        toast.error("Este convite não pode ser utilizado com esta conta.");
        setProcessando(false);
        return;
      }
      window.location.assign("/admin");
    } catch {
      toast.error("Não foi possível ativar o acesso agora. Tente novamente.");
      setProcessando(false);
    }
  }

  async function autenticar() {
    setProcessando(true);
    const dados = { email: email.trim(), password: senha };
    const resultado =
      modo === "criar"
        ? await authClient.signUp.email({ ...dados, name: nome.trim() })
        : await authClient.signIn.email(dados);

    if (resultado.error) {
      toast.error("Não foi possível autenticar com esses dados.");
      setProcessando(false);
      return;
    }
    await aceitar();
  }

  async function entrarComGoogle() {
    await authClient.signIn.social({
      callbackURL: window.location.href,
      provider: "google",
    });
  }

  return (
    <ConteudoConvite
      descricao={
        <>
          Convite destinado a {convite.emailMascarado}. A identidade autenticada
          deve usar exatamente esse e-mail.
        </>
      }
      icone={<Mail className="size-5" aria-hidden="true" />}
      titulo="Ativar acesso administrativo"
    >
      {carregandoSessao ? (
        <Aviso>Verificando sessão…</Aviso>
      ) : sessao?.user ? (
        <div className="space-y-4">
          {identidadeDivergente ? (
            <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">
                Este convite foi enviado para outra conta.
              </p>
              <p className="text-muted-foreground text-sm">
                Use a conta vinculada a {convite.emailMascarado} para continuar.
              </p>
              <BotaoSairConta processando={processando} />
            </div>
          ) : (
            <>
              <p className="text-sm">
                Você está autenticado como <strong>{sessao.user.email}</strong>.
              </p>
              <Button
                className="w-full"
                disabled={processando}
                onClick={aceitar}
              >
                {processando ? "Ativando…" : "Aceitar convite"}
              </Button>
              <BotaoSairConta processando={processando} />
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label="Acesso à conta"
          >
            <Button
              onClick={() => setModo("entrar")}
              type="button"
              variant={modo === "entrar" ? "default" : "outline"}
            >
              Já tenho conta
            </Button>
            <Button
              onClick={() => setModo("criar")}
              type="button"
              variant={modo === "criar" ? "default" : "outline"}
            >
              Criar conta
            </Button>
          </div>
          {modo === "criar" ? (
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                autoComplete="name"
                id="nome"
                onChange={(evento) => setNome(evento.target.value)}
                value={nome}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail do convite</Label>
            <Input
              autoComplete="email"
              id="email"
              onChange={(evento) => setEmail(evento.target.value)}
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              autoComplete={
                modo === "criar" ? "new-password" : "current-password"
              }
              id="senha"
              minLength={8}
              onChange={(evento) => setSenha(evento.target.value)}
              type="password"
              value={senha}
            />
          </div>
          <Button
            className="w-full"
            disabled={
              processando ||
              !email.trim() ||
              senha.length < 8 ||
              (modo === "criar" && !nome.trim())
            }
            onClick={() => void autenticar()}
          >
            {processando
              ? "Processando…"
              : modo === "criar"
                ? "Criar conta e aceitar"
                : "Entrar e aceitar"}
          </Button>
          <Button
            className="w-full"
            onClick={() => void entrarComGoogle()}
            type="button"
            variant="outline"
          >
            Continuar com Google
          </Button>
          <Aviso>Sua senha é definida e conhecida somente por você.</Aviso>
        </div>
      )}
    </ConteudoConvite>
  );
}

function PaginaConviteWhatsapp({
  convite,
  token,
}: {
  convite: ConvitePublico;
  token: string;
}) {
  const { data: sessao, isPending: carregandoSessao } = authClient.useSession();
  const [etapa, setEtapa] = useState<EtapaWhatsapp>("inicial");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState(convite.nome ?? "");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [processando, setProcessando] = useState(false);
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [identidadeDivergente, setIdentidadeDivergente] = useState(false);
  const campoCodigo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const temporizador = window.setInterval(
      () => setSegundosReenvio((atual) => Math.max(0, atual - 1)),
      1_000,
    );
    return () => window.clearInterval(temporizador);
  }, [segundosReenvio]);

  useEffect(() => {
    if (etapa === "codigo") campoCodigo.current?.focus();
  }, [etapa]);

  async function solicitarOtp() {
    if (processando || segundosReenvio > 0) return;
    setProcessando(true);
    setErro(null);
    try {
      const resposta = await chamarEndpoint(
        "/admin/convite/whatsapp/otp/solicitar",
        { token },
      );
      // O passo do código só avança quando o backend confirma o envio real.
      if (resposta.sucesso !== true) {
        // Cooldown ativo: mantém a contagem sem afirmar que houve envio.
        if (resposta.motivo === "AGUARDE") setSegundosReenvio(60);
        setMensagem(null);
        setErro(
          typeof resposta.mensagem === "string"
            ? resposta.mensagem
            : "Não foi possível enviar o código agora. Tente novamente.",
        );
        return;
      }
      setEtapa("codigo");
      setMensagem("Enviamos um código de verificação para o seu WhatsApp.");
      // Mesma janela de reenvio aplicada pela política de OTP no servidor.
      setSegundosReenvio(60);
    } catch {
      setErro("Não foi possível enviar o código agora. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarOtp(evento: FormEvent) {
    evento.preventDefault();
    if (!/^[0-9]{6}$/.test(codigo) || processando) {
      setErro("Informe o código de 6 dígitos recebido.");
      return;
    }
    setProcessando(true);
    setErro(null);
    try {
      const confirmacao = await chamarEndpoint(
        "/admin/convite/whatsapp/otp/confirmar",
        { code: codigo, token },
      );
      if (confirmacao.confirmado !== true) {
        setErro("O código é inválido, expirou ou já foi utilizado.");
        return;
      }
      const identificacao = await chamarEndpoint(
        "/admin/convite/whatsapp/identificar-usuario",
        { token },
      );
      if (identificacao.proximoPasso === "BLOQUEADO") {
        setIdentidadeDivergente(true);
        setErro("Este convite pertence a outra identidade.");
        return;
      }
      if (identificacao.usuarioIdentificado !== true && sessao?.user) {
        setIdentidadeDivergente(true);
        setErro("Saia da conta atual antes de criar a identidade convidada.");
        return;
      }
      setEtapa(
        identificacao.usuarioIdentificado === true ? "aceite" : "cadastro",
      );
      setMensagem(null);
    } catch {
      setErro("Não foi possível confirmar o código agora. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function cadastrar(evento: FormEvent) {
    evento.preventDefault();
    if (processando) return;
    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacaoSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setProcessando(true);
    setErro(null);
    try {
      const resultado = await chamarEndpoint(
        "/admin/convite/whatsapp/cadastrar-usuario",
        {
          email,
          name: nome,
          password: senha,
          passwordConfirmation: confirmacaoSenha,
          token,
        },
      );
      if (resultado.cadastroCriado !== true) {
        setErro("Não foi possível concluir o cadastro com estes dados.");
        return;
      }
      setSenha("");
      setConfirmacaoSenha("");
      setEtapa("aceite");
    } catch {
      setErro("Não foi possível concluir o cadastro agora. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function aceitar() {
    if (processando) return;
    setProcessando(true);
    setErro(null);
    try {
      const resultado = await chamarEndpoint(
        "/admin/convite/whatsapp/aceitar",
        { token },
      );
      if (resultado.aceito !== true) {
        setErro("Este convite não pode mais ser utilizado.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setErro("Não foi possível ativar o acesso agora. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  const sessaoIncompativel = identidadeDivergente;

  return (
    <ConteudoConvite
      descricao={`Este convite foi enviado para o WhatsApp ${convite.telefoneMascarado}.`}
      icone={<MessageCircle className="size-5" aria-hidden="true" />}
      titulo="Convite administrativo"
    >
      <div aria-live="polite" className="space-y-4">
        {mensagem ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            {mensagem}
          </div>
        ) : null}
        {erro ? (
          <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
            {erro}
          </div>
        ) : null}
      </div>
      {carregandoSessao ? <Aviso>Verificando sessão…</Aviso> : null}
      {!carregandoSessao && sessaoIncompativel ? (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium">
            Este convite pertence a outra identidade.
          </p>
          <p className="text-muted-foreground text-sm">
            Saia da conta atual para confirmar o WhatsApp convidado.
          </p>
          <BotaoSairConta processando={processando} />
        </div>
      ) : null}
      {!carregandoSessao &&
      !sessaoIncompativel &&
      sessao?.user &&
      etapa === "inicial" ? (
        <div className="bg-muted/40 space-y-3 rounded-lg border p-3">
          <p className="text-sm">
            Você está autenticado como <strong>{sessao.user.email}</strong>.
          </p>
          <p className="text-muted-foreground text-sm">
            Continue somente se esta for a identidade vinculada ao WhatsApp
            convidado.
          </p>
          <BotaoSairConta processando={processando} />
        </div>
      ) : null}
      {!carregandoSessao && !sessaoIncompativel && etapa === "inicial" ? (
        <Button
          className="w-full gap-2"
          disabled={processando || segundosReenvio > 0}
          onClick={() => void solicitarOtp()}
        >
          {processando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <MessageCircle className="size-4" aria-hidden="true" />
          )}
          Enviar código pelo WhatsApp
        </Button>
      ) : null}
      {!carregandoSessao && !sessaoIncompativel && etapa === "codigo" ? (
        <form className="space-y-4" onSubmit={confirmarOtp}>
          <div className="space-y-2">
            <Label htmlFor="codigo-verificacao">Código de verificação</Label>
            <Input
              ref={campoCodigo}
              autoComplete="one-time-code"
              id="codigo-verificacao"
              inputMode="numeric"
              maxLength={6}
              onChange={(evento) =>
                setCodigo(evento.target.value.replace(/\D/g, ""))
              }
              pattern="[0-9]{6}"
              value={codigo}
            />
          </div>
          <Button
            className="w-full"
            disabled={processando || codigo.length !== 6}
            type="submit"
          >
            {processando ? "Confirmando…" : "Confirmar código"}
          </Button>
          <Button
            className="w-full"
            disabled={processando || segundosReenvio > 0}
            onClick={() => void solicitarOtp()}
            type="button"
            variant="outline"
          >
            {segundosReenvio > 0
              ? `Reenviar código em ${segundosReenvio}s`
              : "Reenviar código"}
          </Button>
        </form>
      ) : null}
      {!carregandoSessao && !sessaoIncompativel && etapa === "cadastro" ? (
        <form className="space-y-4" onSubmit={cadastrar}>
          <div className="bg-muted rounded-lg p-3 text-sm">
            WhatsApp confirmado: <strong>{convite.telefoneMascarado}</strong>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome-cadastro">Nome</Label>
            <Input
              autoComplete="name"
              id="nome-cadastro"
              onChange={(evento) => setNome(evento.target.value)}
              value={nome}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-cadastro">E-mail</Label>
            <Input
              autoComplete="email"
              id="email-cadastro"
              onChange={(evento) => setEmail(evento.target.value)}
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha-cadastro">Senha</Label>
            <Input
              autoComplete="new-password"
              id="senha-cadastro"
              minLength={8}
              onChange={(evento) => setSenha(evento.target.value)}
              type="password"
              value={senha}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao-senha-cadastro">Confirmar senha</Label>
            <Input
              autoComplete="new-password"
              id="confirmacao-senha-cadastro"
              minLength={8}
              onChange={(evento) => setConfirmacaoSenha(evento.target.value)}
              type="password"
              value={confirmacaoSenha}
            />
          </div>
          <Button
            className="w-full"
            disabled={
              processando ||
              !nome.trim() ||
              !email.trim() ||
              senha.length < 8 ||
              confirmacaoSenha.length < 8
            }
            type="submit"
          >
            {processando ? "Criando conta…" : "Criar conta"}
          </Button>
        </form>
      ) : null}
      {!carregandoSessao && etapa === "aceite" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4" aria-hidden="true" /> WhatsApp
              confirmado
            </p>
            <p className="mt-1">
              Agora você pode aceitar o convite administrativo.
            </p>
          </div>
          <Button
            className="w-full gap-2"
            disabled={processando}
            onClick={() => void aceitar()}
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            {processando ? "Ativando…" : "Aceitar convite"}
          </Button>
        </div>
      ) : null}
    </ConteudoConvite>
  );
}

export function PaginaAceiteConvite({
  convite,
  token,
}: {
  convite: ConvitePublico;
  token: string;
}) {
  if (convite.estado !== "valido") {
    return (
      <ConteudoConvite
        descricao="Este convite pode ser inválido, estar expirado ou já ter sido utilizado. Solicite um novo convite ao administrador."
        icone={<ShieldCheck className="size-5" aria-hidden="true" />}
        titulo="Convite indisponível"
      >
        <Aviso>Não há nenhuma ação disponível para este link.</Aviso>
      </ConteudoConvite>
    );
  }

  return convite.tipoIdentificador === "whatsapp" ? (
    <PaginaConviteWhatsapp convite={convite} token={token} />
  ) : (
    <PaginaConviteEmail convite={convite} token={token} />
  );
}
