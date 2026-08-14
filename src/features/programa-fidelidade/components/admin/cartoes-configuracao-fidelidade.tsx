import { Coins, Gift, RefreshCw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import type { ConfiguracaoFidelidadeMock } from "../../types/programa-fidelidade.types";
import { CampoRegraPontos } from "./campo-regra-pontos";

type Props = {
  configuracao: ConfiguracaoFidelidadeMock;
  atualizar: <Campo extends keyof ConfiguracaoFidelidadeMock>(
    campo: Campo,
    valor: ConfiguracaoFidelidadeMock[Campo],
  ) => void;
};

export function CartoesConfiguracaoFidelidade({
  configuracao,
  atualizar,
}: Props) {
  return (
    <section
      aria-labelledby="configuracao-programa"
      className="grid gap-4 xl:grid-cols-2"
    >
      <Card className="xl:row-span-2">
        <CardHeader>
          <CardTitle
            id="configuracao-programa"
            className="flex items-center gap-2"
          >
            <Coins className="text-primary size-5" /> Configuração do programa
          </CardTitle>
          <CardDescription>
            Defina o nome e a regra que será herdada pelas categorias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="programa-ativo">Programa ativo</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Status apenas demonstrativo nesta etapa.
              </p>
            </div>
            <Switch
              id="programa-ativo"
              checked={configuracao.ativo}
              onCheckedChange={(valor) => atualizar("ativo", valor)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome-publico">Nome público do programa</Label>
            <Input
              id="nome-publico"
              value={configuracao.nomePublico}
              onChange={(e) => atualizar("nomePublico", e.target.value)}
            />
          </div>
          <CampoRegraPontos
            id="regra-padrao"
            valorGasto={configuracao.valorGastoPadrao}
            pontos={configuracao.pontosPadrao}
            onValorGastoChange={(v) => atualizar("valorGastoPadrao", v)}
            onPontosChange={(v) => atualizar("pontosPadrao", v)}
          />
          <p className="bg-primary/5 text-primary border-primary/15 rounded-lg border p-3 text-sm font-medium">
            Regra padrão: R$ {configuracao.valorGastoPadrao || "0"} gasto ={" "}
            {configuracao.pontosPadrao || "0"} ponto(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="text-primary size-5" /> Conversão em crédito
          </CardTitle>
          <CardDescription>
            Conversão global e única para toda a loja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pontos-conversao">Quantidade de pontos</Label>
              <Input
                id="pontos-conversao"
                inputMode="decimal"
                value={configuracao.pontosConversao}
                onChange={(e) => atualizar("pontosConversao", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor-credito">Valor em reais</Label>
              <Input
                id="valor-credito"
                inputMode="decimal"
                value={configuracao.valorCredito}
                onChange={(e) => atualizar("valorCredito", e.target.value)}
              />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {configuracao.pontosConversao || "0"} pontos = R${" "}
            {configuracao.valorCredito || "0"} de crédito. Categorias acumulam
            em velocidades diferentes, mas todos os pontos têm esta mesma
            conversão.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="text-primary size-5" /> Regras de resgate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="minimo-resgate">Mínimo de pontos</Label>
            <Input
              id="minimo-resgate"
              inputMode="numeric"
              value={configuracao.minimoResgate}
              onChange={(e) => atualizar("minimoResgate", e.target.value)}
            />
            <p className="text-muted-foreground text-sm">
              Resgate disponível a partir de {configuracao.minimoResgate || "0"}{" "}
              pontos.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Validade dos pontos</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={configuracao.tipoValidade}
              onValueChange={(v) =>
                atualizar(
                  "tipoValidade",
                  v as ConfiguracaoFidelidadeMock["tipoValidade"],
                )
              }
            >
              <label className="flex cursor-pointer items-center gap-3">
                <RadioGroupItem value="nao_expiram" />{" "}
                <span className="text-sm font-medium">Não expiram</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <RadioGroupItem value="expiram" />{" "}
                <span className="text-sm font-medium">Expiram após X dias</span>
              </label>
            </RadioGroup>
            {configuracao.tipoValidade === "expiram" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="dias-validade">Número de dias</Label>
                <Input
                  id="dias-validade"
                  inputMode="numeric"
                  value={configuracao.diasValidade}
                  onChange={(e) => atualizar("diasValidade", e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
