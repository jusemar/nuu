"use client";

import { useState, useTransition } from "react";
import { Save, Store } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { salvarConfiguracaoLoja } from "../../actions/salvar-configuracao-loja";

type FormularioConfiguracaoLojaProps = {
  nomeComercialInicial: string | null;
};

export function FormularioConfiguracaoLoja({
  nomeComercialInicial,
}: FormularioConfiguracaoLojaProps) {
  const [nomeComercial, setNomeComercial] = useState(
    nomeComercialInicial ?? "",
  );
  const [salvando, iniciarSalvamento] = useTransition();

  function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    iniciarSalvamento(async () => {
      try {
        const resultado = await salvarConfiguracaoLoja({ nomeComercial });
        toast.success(resultado.message);
      } catch (error) {
        console.error("Erro ao salvar configurações da loja:", error);
        toast.error("Não foi possível salvar as configurações da loja.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Configurações da loja
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Defina informações globais reutilizadas na experiência da loja.
        </p>
      </header>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="text-primary h-5 w-5" aria-hidden="true" />
            Identidade comercial
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Este nome será exibido como vendedor em todas as páginas de produto.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={salvar}>
            <div className="space-y-2">
              <Label htmlFor="nome-comercial-loja">
                Nome comercial da loja
              </Label>
              <Input
                id="nome-comercial-loja"
                value={nomeComercial}
                onChange={(evento) => setNomeComercial(evento.target.value)}
                maxLength={120}
                placeholder="Ex.: Do Rocha"
                autoComplete="organization"
                disabled={salvando}
              />
              <p className="text-muted-foreground text-xs">
                Deixe vazio para ocultar “Vendido por” nas páginas de produto.
              </p>
            </div>

            <Button type="submit" disabled={salvando} className="gap-2">
              <Save className="h-4 w-4" aria-hidden="true" />
              {salvando ? "Salvando..." : "Salvar configurações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
