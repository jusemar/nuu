"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

import { CampoSenha } from "../autenticacao/campo-senha";

export function PaginaRedefinirSenhaCliente({
  token,
  tokenInvalido,
}: {
  token: string | null;
  tokenInvalido: boolean;
}) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function redefinir(evento: FormEvent) {
    evento.preventDefault();
    if (!token || tokenInvalido || processando) return;
    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }
    setErro(null);
    setProcessando(true);
    try {
      const resultado = await authClient.resetPassword({
        newPassword: novaSenha,
        token,
      });
      if (resultado.error) throw new Error("TOKEN_INVALIDO");
      window.location.assign("/authentication?recuperacao=concluida");
    } catch {
      setErro(
        "Este link é inválido, expirou ou já foi utilizado. Solicite um novo link.",
      );
    } finally {
      setProcessando(false);
    }
  }

  const bloqueado = tokenInvalido || !token;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-slate-200 shadow-lg shadow-slate-200/50">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Criar nova senha</CardTitle>
          <p className="text-sm text-slate-500">
            Defina uma nova senha para sua conta da loja.
          </p>
        </CardHeader>
        <CardContent>
          {bloqueado || erro ? (
            <p
              role="alert"
              className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
            >
              {erro ??
                "Este link é inválido ou expirou. Solicite uma nova recuperação."}
            </p>
          ) : null}
          {!bloqueado ? (
            <form onSubmit={redefinir} className="space-y-4">
              <CampoSenha
                id="nova-senha-email"
                label="Nova senha"
                value={novaSenha}
                onChange={setNovaSenha}
                autoComplete="new-password"
                disabled={processando}
              />
              <CampoSenha
                id="confirmar-senha-email"
                label="Confirmar nova senha"
                value={confirmacao}
                onChange={setConfirmacao}
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
          {bloqueado ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/authentication/recuperar">Solicitar novo link</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
