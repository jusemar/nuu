"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
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

import {
  type AlterarSenhaMinhaContaAdminSchema,
  alterarSenhaMinhaContaAdminSchema,
} from "../../schemas/alterar-senha-minha-conta-admin.schema";

function mensagemErroAlteracaoSenha(codigo: string | undefined) {
  if (codigo === "INVALID_PASSWORD") return "A senha atual não confere.";
  if (codigo === "PASSWORD_TOO_SHORT") {
    return "A nova senha deve ter pelo menos 8 caracteres.";
  }

  return "Não foi possível alterar a senha agora. Tente novamente.";
}

export function FormularioAlterarSenhaMinhaContaAdmin() {
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const formulario = useForm<AlterarSenhaMinhaContaAdminSchema>({
    resolver: zodResolver(alterarSenhaMinhaContaAdminSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmacaoNovaSenha: "",
    },
  });

  async function salvar(dados: AlterarSenhaMinhaContaAdminSchema) {
    try {
      const resultado = await authClient.changePassword({
        currentPassword: dados.senhaAtual,
        newPassword: dados.novaSenha,
        revokeOtherSessions: true,
      });

      if (resultado.error) {
        toast.error(mensagemErroAlteracaoSenha(resultado.error.code));
        return;
      }

      formulario.reset();
      toast.success("Senha atualizada. As demais sessões foram encerradas.");
    } catch {
      toast.error("Não foi possível alterar a senha agora. Tente novamente.");
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="text-primary h-5 w-5" aria-hidden="true" />
          Alterar senha
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Confirme sua senha atual antes de definir uma nova senha.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...formulario}>
          <form
            className="space-y-5"
            onSubmit={formulario.handleSubmit(salvar)}
          >
            {(
              [
                ["senhaAtual", "Senha atual", "current-password"],
                ["novaSenha", "Nova senha", "new-password"],
                [
                  "confirmacaoNovaSenha",
                  "Confirmar nova senha",
                  "new-password",
                ],
              ] as const
            ).map(([nome, rotulo, preenchimento]) => (
              <FormField
                key={nome}
                control={formulario.control}
                name={nome}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{rotulo}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={senhaVisivel ? "text" : "password"}
                          autoComplete={preenchimento}
                          disabled={formulario.formState.isSubmitting}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                          onClick={() => setSenhaVisivel((visivel) => !visivel)}
                          aria-label={
                            senhaVisivel ? "Ocultar senhas" : "Mostrar senhas"
                          }
                        >
                          {senhaVisivel ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="submit" disabled={formulario.formState.isSubmitting}>
              {formulario.formState.isSubmitting
                ? "Alterando..."
                : "Alterar senha"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
