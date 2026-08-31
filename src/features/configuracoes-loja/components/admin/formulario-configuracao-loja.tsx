"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Save, Store } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { salvarConfiguracaoLoja } from "../../actions/salvar-configuracao-loja";
import { DADOS_EMPRESA } from "../../constants/dados-empresa";
import { configuracaoLojaSchema } from "../../schemas/configuracao-loja.schema";
import { CampoUploadLogo } from "./campo-upload-logo";

type DadosFormulario = z.infer<typeof configuracaoLojaSchema>;
type Props = {
  nomeComercialInicial: string | null;
  logoCabecalhoUrlInicial: string | null;
  logoRodapeUrlInicial: string | null;
};

export function FormularioConfiguracaoLoja({
  nomeComercialInicial,
  logoCabecalhoUrlInicial,
  logoRodapeUrlInicial,
}: Props) {
  const [salvando, iniciarSalvamento] = useTransition();
  const formulario = useForm<DadosFormulario>({
    resolver: zodResolver(configuracaoLojaSchema),
    defaultValues: {
      nomeComercial: nomeComercialInicial ?? "",
      logoCabecalhoUrl: logoCabecalhoUrlInicial ?? "",
      logoRodapeUrl: logoRodapeUrlInicial ?? "",
    },
  });

  function salvar(dados: DadosFormulario) {
    iniciarSalvamento(async () => {
      try {
        const resultado = await salvarConfiguracaoLoja(dados);
        formulario.reset(dados);
        toast.success(resultado.message);
      } catch (error) {
        console.error("Erro ao salvar configurações da loja:", error);
        toast.error("Não foi possível salvar as configurações da loja.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Configurações da loja
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gerencie a identidade comercial e visual exibida na loja.
        </p>
      </header>
      <Form {...formulario}>
        <form className="space-y-6" onSubmit={formulario.handleSubmit(salvar)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="text-primary size-5" aria-hidden="true" />
                Identidade comercial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={formulario.control}
                name="nomeComercial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome comercial da loja</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={120}
                        placeholder={`Ex.: ${DADOS_EMPRESA.marca}`}
                        autoComplete="organization"
                        disabled={salvando}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe vazio para ocultar “Vendido por” nas páginas de
                      produto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="text-primary size-5" aria-hidden="true" />
                Logos da loja
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Cada área é independente. A imagem é contida no espaço
                disponível sem recorte ou distorção.
              </p>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <FormField
                control={formulario.control}
                name="logoCabecalhoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CampoUploadLogo
                        local="cabecalho"
                        titulo="Logo do cabeçalho"
                        url={field.value}
                        onChange={field.onChange}
                        disabled={salvando}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formulario.control}
                name="logoRodapeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CampoUploadLogo
                        local="rodape"
                        titulo="Logo do rodapé"
                        url={field.value}
                        onChange={field.onChange}
                        disabled={salvando}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Button
            type="submit"
            disabled={salvando || !formulario.formState.isDirty}
          >
            <Save className="size-4" aria-hidden="true" />
            {salvando ? "Salvando..." : "Salvar configurações"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
