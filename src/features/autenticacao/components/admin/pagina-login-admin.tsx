"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

import { validarAcessoAdmin } from "../../actions/validar-acesso-admin";

const loginAdminSchema = z.object({
  email: z.email("Informe um email válido."),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type DadosLoginAdmin = z.infer<typeof loginAdminSchema>;

type PaginaLoginAdminProps = {
  destino: string;
  mensagemInicial?: string | null;
  encerrarSessaoAtual?: boolean;
};

export function PaginaLoginAdmin({
  destino,
  mensagemInicial,
  encerrarSessaoAtual = false,
}: PaginaLoginAdminProps) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(mensagemInicial ?? null);
  const [entrando, setEntrando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const formulario = useForm<DadosLoginAdmin>({
    resolver: zodResolver(loginAdminSchema),
    defaultValues: { email: "", senha: "" },
  });

  useEffect(() => {
    if (!encerrarSessaoAtual) return;
    void authClient.signOut();
  }, [encerrarSessaoAtual]);

  async function entrarComEmail(dados: DadosLoginAdmin) {
    setEntrando(true);
    setErro(null);

    try {
      const resultado = await authClient.signIn.email({
        email: dados.email,
        password: dados.senha,
      });

      if (resultado.error) {
        setErro("Email ou senha inválidos.");
        return;
      }

      const acesso = await validarAcessoAdmin();

      if (!acesso.sucesso) {
        await authClient.signOut();
        setErro(
          acesso.erro ??
            "Esta conta não possui permissão para acessar o painel administrativo.",
        );
        return;
      }

      router.replace(destino);
      router.refresh();
    } catch {
      setErro("Não foi possível entrar agora. Tente novamente.");
    } finally {
      setEntrando(false);
    }
  }

  const processando = entrando;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Link>
          <div className="mx-auto mt-6 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Do Rocha</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-xl">
              Entrar no painel administrativo
            </CardTitle>
            <CardDescription>
              Acesse sua conta para gerenciar a loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {erro ? (
              <div
                role="alert"
                className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {erro}
              </div>
            ) : null}

            <Form {...formulario}>
              <form
                onSubmit={formulario.handleSubmit(entrarComEmail)}
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
                          disabled={processando}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formulario.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel>Senha</FormLabel>
                        <Link
                          href="/admin/esqueci-senha"
                          className="text-xs font-medium text-slate-600 hover:text-slate-950 hover:underline"
                        >
                          Esqueci minha senha
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={senhaVisivel ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Digite sua senha"
                            disabled={processando}
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSenhaVisivel((visivel) => !visivel)
                            }
                            disabled={processando}
                            aria-label={
                              senhaVisivel ? "Ocultar senha" : "Mostrar senha"
                            }
                            aria-pressed={senhaVisivel}
                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 transition-colors hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {senhaVisivel ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={processando}>
                  {entrando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {entrando ? "Entrando..." : "Entrar no admin"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Acesso restrito a contas administrativas autorizadas.
        </p>
      </div>
    </main>
  );
}
