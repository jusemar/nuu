"use client";

import { useState } from "react";
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
  estado: EstadoConvitePublico;
  emailMascarado?: string;
  nome?: string;
};

export function PaginaAceiteConvite({
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

  if (convite.estado !== "valido") {
    return (
      <main className="bg-muted/40 flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convite indisponível</CardTitle>
            <CardDescription>
              Este convite não pode ser utilizado. Solicite um novo convite ao
              administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  async function aceitar() {
    setProcessando(true);
    const resultado = await aceitarConviteAdministrador(token);
    if (!resultado.sucesso) {
      toast.error(resultado.mensagem);
      setProcessando(false);
      return;
    }
    window.location.assign("/admin");
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
    <main className="bg-muted/40 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ativar acesso administrativo</CardTitle>
          <CardDescription>
            Convite destinado a {convite.emailMascarado}. A identidade
            autenticada deve usar exatamente esse e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {carregandoSessao ? (
            <p className="text-muted-foreground text-sm">Verificando sessão…</p>
          ) : sessao?.user ? (
            <div className="space-y-4">
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
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
              {modo === "criar" && (
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    autoComplete="name"
                    id="nome"
                    onChange={(evento) => setNome(evento.target.value)}
                    value={nome}
                  />
                </div>
              )}
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
                onClick={autenticar}
              >
                {processando
                  ? "Processando…"
                  : modo === "criar"
                    ? "Criar conta e aceitar"
                    : "Entrar e aceitar"}
              </Button>
              <Button
                className="w-full"
                onClick={entrarComGoogle}
                type="button"
                variant="outline"
              >
                Continuar com Google
              </Button>
              <p className="text-muted-foreground text-xs">
                Sua senha é definida e conhecida somente por você. O emissor do
                convite nunca recebe sua credencial.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
