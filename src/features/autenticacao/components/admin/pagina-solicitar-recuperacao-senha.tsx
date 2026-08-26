"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
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

const formularioSchema = z.object({
  email: z.email("Informe um email válido."),
});

type DadosFormulario = z.infer<typeof formularioSchema>;

const MENSAGEM_NEUTRA =
  "Se o email pertencer a uma conta administrativa autorizada, você receberá as instruções em instantes.";

export function PaginaSolicitarRecuperacaoSenha() {
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const formulario = useForm<DadosFormulario>({
    resolver: zodResolver(formularioSchema),
    defaultValues: { email: "" },
  });

  async function solicitarRecuperacao(dados: DadosFormulario) {
    if (enviando) return;

    setEnviando(true);
    setMensagem(null);
    setErro(null);

    try {
      const resultado = await authClient.requestPasswordReset({
        email: dados.email,
        // Redirect relativo evita divergências entre o domínio canônico e
        // aliases válidos que possam ter aberto esta página.
        redirectTo: "/admin/redefinir-senha",
      });

      if (resultado.error?.status === 429) {
        setErro("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        return;
      }

      if (resultado.error) {
        // A mensagem permanece neutra; o motivo técnico é registrado apenas
        // pelo backend, sem expor existência ou papel da conta.
        setMensagem(MENSAGEM_NEUTRA);
        return;
      }

      // A mensagem é idêntica para emails existentes e inexistentes.
      setMensagem(MENSAGEM_NEUTRA);
    } catch {
      setErro(
        "Não foi possível processar a solicitação agora. Tente novamente.",
      );
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
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">Recuperar acesso</CardTitle>
            <CardDescription>
              Informe o email utilizado no painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mensagem ? (
              <div
                role="status"
                className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
              >
                {mensagem}
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

            <Form {...formulario}>
              <form
                onSubmit={formulario.handleSubmit(solicitarRecuperacao)}
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
                  {enviando ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
