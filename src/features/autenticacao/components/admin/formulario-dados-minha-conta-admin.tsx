"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { atualizarDadosMinhaContaAdmin } from "../../actions/atualizar-dados-minha-conta-admin";
import {
  type DadosMinhaContaAdminSchema,
  dadosMinhaContaAdminSchema,
} from "../../schemas/dados-minha-conta-admin.schema";

type FormularioDadosMinhaContaAdminProps = {
  dadosIniciais: DadosMinhaContaAdminSchema;
};

export function FormularioDadosMinhaContaAdmin({
  dadosIniciais,
}: FormularioDadosMinhaContaAdminProps) {
  const router = useRouter();
  const formulario = useForm<DadosMinhaContaAdminSchema>({
    resolver: zodResolver(dadosMinhaContaAdminSchema),
    defaultValues: dadosIniciais,
  });

  async function salvar(dados: DadosMinhaContaAdminSchema) {
    try {
      const resultado = await atualizarDadosMinhaContaAdmin(dados);

      if (!resultado.sucesso) {
        toast.error(resultado.mensagem);
        return;
      }

      toast.success(resultado.mensagem);
      formulario.reset(dados);

      if (resultado.reautenticar) {
        await authClient.signOut();
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar os dados da conta agora.");
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserRound className="text-primary h-5 w-5" aria-hidden="true" />
          Dados da conta
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Atualize os dados usados para acessar e identificar sua conta.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...formulario}>
          <form
            className="space-y-5"
            onSubmit={formulario.handleSubmit(salvar)}
          >
            <FormField
              control={formulario.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      disabled={formulario.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      disabled={formulario.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Alterar o e-mail encerra as sessões atuais e exige novo
                    login.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+55 (31) 99999-9999"
                      disabled={formulario.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Aceita número com ou sem +55 e formatação. Deixe vazio para
                    remover este identificador.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="gap-2"
              disabled={formulario.formState.isSubmitting}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {formulario.formState.isSubmitting
                ? "Salvando..."
                : "Salvar dados"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
