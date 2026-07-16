"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

const formularioSchema = z
  .object({
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não coincidem.",
    path: ["confirmacao"],
  });

type DadosFormulario = z.infer<typeof formularioSchema>;

type PaginaRedefinirSenhaProps = {
  token: string | null;
  tokenInvalido: boolean;
};

export function PaginaRedefinirSenha({
  token,
  tokenInvalido,
}: PaginaRedefinirSenhaProps) {
  const [salvando, setSalvando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const formulario = useForm<DadosFormulario>({
    resolver: zodResolver(formularioSchema),
    defaultValues: { senha: "", confirmacao: "" },
  });
  const formularioBloqueado = tokenInvalido || !token || concluido;

  async function redefinirSenha(dados: DadosFormulario) {
    if (!token || salvando || formularioBloqueado) return;

    setSalvando(true);
    setErro(null);

    try {
      const resultado = await authClient.resetPassword({
        newPassword: dados.senha,
        token,
      });

      if (resultado.error) {
        setErro(
          "Este link é inválido, expirou ou já foi utilizado. Solicite um novo link.",
        );
        return;
      }

      setConcluido(true);
      formulario.reset();
    } catch {
      setErro("Não foi possível redefinir a senha agora. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md border-slate-200 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Criar nova senha</CardTitle>
          <CardDescription>
            Defina uma nova senha para acessar o painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenInvalido || !token ? (
            <div
              role="alert"
              className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              Este link é inválido ou expirou. Solicite uma nova recuperação de
              senha.
            </div>
          ) : null}
          {concluido ? (
            <div
              role="status"
              className="space-y-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800"
            >
              <p>
                Senha redefinida com sucesso. Você já pode entrar no painel.
              </p>
              <Button asChild className="w-full">
                <Link href="/admin/login">Ir para o login</Link>
              </Button>
            </div>
          ) : null}
          {erro ? (
            <div
              role="alert"
              className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {erro}
            </div>
          ) : null}

          {!concluido ? (
            <Form {...formulario}>
              <form
                onSubmit={formulario.handleSubmit(redefinirSenha)}
                className="space-y-4"
              >
                {(["senha", "confirmacao"] as const).map((nomeCampo) => (
                  <FormField
                    key={nomeCampo}
                    control={formulario.control}
                    name={nomeCampo}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {nomeCampo === "senha"
                            ? "Nova senha"
                            : "Confirmar nova senha"}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={senhaVisivel ? "text" : "password"}
                              autoComplete="new-password"
                              disabled={salvando || formularioBloqueado}
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setSenhaVisivel((valor) => !valor)}
                              disabled={salvando || formularioBloqueado}
                              aria-label={
                                senhaVisivel
                                  ? "Ocultar senhas"
                                  : "Mostrar senhas"
                              }
                              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-950 disabled:opacity-50"
                            >
                              {senhaVisivel ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={salvando || formularioBloqueado}
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {salvando ? "Salvando..." : "Redefinir senha"}
                </Button>
                {formularioBloqueado ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/esqueci-senha">Solicitar novo link</Link>
                  </Button>
                ) : null}
              </form>
            </Form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
