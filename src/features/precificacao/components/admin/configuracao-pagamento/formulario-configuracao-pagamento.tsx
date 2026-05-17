"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";

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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { atualizarConfiguracaoPagamento } from "../../../actions/atualizar-configuracao-pagamento";
import type { ConfiguracaoPagamentoCalculavel } from "../../../types/precificacao.types";

type FormularioConfiguracaoPagamentoProps = {
  configuracaoInicial: ConfiguracaoPagamentoCalculavel;
};

type EstadoFormularioConfiguracaoPagamento = {
  pixAtivo: boolean;
  cartaoAtivo: boolean;
  boletoAtivo: boolean;
  percentualAcrescimoCartao: string;
  parcelasSemJuros: string;
  taxaJurosMensal: string;
  maximoParcelas: string;
  valorMinimoParcela: string;
};

function formatarPercentualInicial(valorBps: number) {
  return String(valorBps / 100).replace(".", ",");
}

function formatarReaisInicial(valorEmCentavos: number) {
  return String(valorEmCentavos / 100).replace(".", ",");
}

function normalizarNumeroDecimal(valor: string) {
  return Number(valor.replace(",", "."));
}

function converterPercentualParaBps(valor: string) {
  return Math.round(normalizarNumeroDecimal(valor) * 100);
}

function converterReaisParaCentavos(valor: string) {
  return Math.round(normalizarNumeroDecimal(valor) * 100);
}

export function FormularioConfiguracaoPagamento({
  configuracaoInicial,
}: FormularioConfiguracaoPagamentoProps) {
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [formulario, setFormulario] =
    useState<EstadoFormularioConfiguracaoPagamento>({
      pixAtivo: configuracaoInicial.pixAtivo,
      cartaoAtivo: configuracaoInicial.cartaoAtivo,
      boletoAtivo: configuracaoInicial.boletoAtivo,
      percentualAcrescimoCartao: formatarPercentualInicial(
        configuracaoInicial.percentualAcrescimoCartaoBps,
      ),
      parcelasSemJuros: String(configuracaoInicial.parcelasSemJuros),
      taxaJurosMensal: formatarPercentualInicial(
        configuracaoInicial.taxaJurosMensalBps,
      ),
      maximoParcelas: String(configuracaoInicial.maximoParcelas),
      valorMinimoParcela: formatarReaisInicial(
        configuracaoInicial.valorMinimoParcelaEmCentavos,
      ),
    });

  function atualizarCampo(
    campo: keyof EstadoFormularioConfiguracaoPagamento,
    valor: string | boolean,
  ) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));
  }

  function salvarConfiguracao() {
    setMensagem(null);
    setErro(null);

    startTransition(async () => {
      try {
        await atualizarConfiguracaoPagamento({
          pixAtivo: formulario.pixAtivo,
          cartaoAtivo: formulario.cartaoAtivo,
          boletoAtivo: formulario.boletoAtivo,
          percentualAcrescimoCartaoBps: converterPercentualParaBps(
            formulario.percentualAcrescimoCartao,
          ),
          parcelasSemJuros: Number(formulario.parcelasSemJuros),
          taxaJurosMensalBps: converterPercentualParaBps(
            formulario.taxaJurosMensal,
          ),
          maximoParcelas: Number(formulario.maximoParcelas),
          valorMinimoParcelaEmCentavos: converterReaisParaCentavos(
            formulario.valorMinimoParcela,
          ),
        });

        setMensagem("Configuração de pagamento salva com sucesso.");
      } catch {
        setErro("Não foi possível salvar. Revise os valores informados.");
      }
    });
  }

  return (
    <Card className="rounded-lg border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Regras comerciais de pagamento</CardTitle>
        <CardDescription>
          Configure as regras usadas pelo backend para calcular Pix, cartão e
          parcelamento antes de enviar o valor final ao gateway.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div className="space-y-1">
              <Label htmlFor="pixAtivo">Pix</Label>
              <p className="text-sm text-gray-500">Disponível no checkout</p>
            </div>
            <Switch
              id="pixAtivo"
              checked={formulario.pixAtivo}
              onCheckedChange={(valor) => atualizarCampo("pixAtivo", valor)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div className="space-y-1">
              <Label htmlFor="cartaoAtivo">Cartão</Label>
              <p className="text-sm text-gray-500">Stripe Checkout</p>
            </div>
            <Switch
              id="cartaoAtivo"
              checked={formulario.cartaoAtivo}
              onCheckedChange={(valor) => atualizarCampo("cartaoAtivo", valor)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div className="space-y-1">
              <Label htmlFor="boletoAtivo">Boleto</Label>
              <p className="text-sm text-gray-500">Preparado para futuro</p>
            </div>
            <Switch
              id="boletoAtivo"
              checked={formulario.boletoAtivo}
              onCheckedChange={(valor) => atualizarCampo("boletoAtivo", valor)}
            />
          </div>
        </div>

        <Separator />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="percentualAcrescimoCartao">
              Acréscimo cartão (%)
            </Label>
            <Input
              id="percentualAcrescimoCartao"
              inputMode="decimal"
              value={formulario.percentualAcrescimoCartao}
              onChange={(event) =>
                atualizarCampo("percentualAcrescimoCartao", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parcelasSemJuros">Parcelas sem juros</Label>
            <Input
              id="parcelasSemJuros"
              inputMode="numeric"
              value={formulario.parcelasSemJuros}
              onChange={(event) =>
                atualizarCampo("parcelasSemJuros", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxaJurosMensal">Juros mensal (%)</Label>
            <Input
              id="taxaJurosMensal"
              inputMode="decimal"
              value={formulario.taxaJurosMensal}
              onChange={(event) =>
                atualizarCampo("taxaJurosMensal", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maximoParcelas">Máximo de parcelas</Label>
            <Input
              id="maximoParcelas"
              inputMode="numeric"
              value={formulario.maximoParcelas}
              onChange={(event) =>
                atualizarCampo("maximoParcelas", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMinimoParcela">Parcela mínima (R$)</Label>
            <Input
              id="valorMinimoParcela"
              inputMode="decimal"
              value={formulario.valorMinimoParcela}
              onChange={(event) =>
                atualizarCampo("valorMinimoParcela", event.target.value)
              }
            />
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          Essas regras são usadas na PDP, no carrinho e no checkout. O Stripe
          recebe apenas o valor final já calculado pelo backend.
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {mensagem && <span className="text-emerald-700">{mensagem}</span>}
            {erro && <span className="text-red-600">{erro}</span>}
          </div>

          <Button
            type="button"
            onClick={salvarConfiguracao}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Save />}
            Salvar regras
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
