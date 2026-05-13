"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCarrinho } from "@/features/carrinho";

import { consultarEnderecoCep } from "../../../actions/consultar-endereco-cep";
import { criarSessaoCheckoutStripe } from "../../../actions/criar-sessao-checkout-stripe";
import { validarCupomCheckout } from "../../../actions/validar-cupom-checkout";
import { calcularFreteCheckout } from "../../../lib/calcular-frete-checkout";
import { calcularTotalCheckout } from "../../../lib/calcular-total-checkout";
import {
  checkoutVisitanteSchema,
  type CheckoutVisitanteSchema,
} from "../../../schemas/checkout.schema";
import { CampoCupom } from "./campo-cupom";
import { FormularioEndereco } from "./formulario-endereco";
import { FormularioIdentificacao } from "./formulario-identificacao";
import { OpcoesFrete } from "./opcoes-frete";
import { OpcoesPagamento } from "./opcoes-pagamento";
import { ResumoPedido } from "./resumo-pedido";

export function CheckoutVisitante() {
  const carrinho = useCarrinho();
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [mensagemCupom, setMensagemCupom] = useState<string | null>(null);
  const [mensagemCep, setMensagemCep] = useState<string | null>(null);
  const [ultimoCepConsultado, setUltimoCepConsultado] = useState<string | null>(
    null,
  );
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);

  const form = useForm<CheckoutVisitanteSchema>({
    resolver: zodResolver(checkoutVisitanteSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      documento: "",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      observacao: "",
      cupom: "",
      freteId: "padrao",
      formaPagamento: "pix",
      parcelasCartao: 1,
      itens: [],
    },
  });

  const freteSelecionado = form.watch("freteId");
  const formaPagamento = form.watch("formaPagamento");
  const parcelasCartao = form.watch("parcelasCartao");
  const cupom = form.watch("cupom");
  const frete = calcularFreteCheckout(freteSelecionado);

  useEffect(() => {
    // O formulário valida os dados; o carrinho continua sendo fonte do domínio carrinho.
    form.setValue("itens", carrinho.itens);
  }, [carrinho.itens, form]);

  const totais = useMemo(
    () =>
      calcularTotalCheckout({
        itens: carrinho.itens,
        freteEmCentavos: frete.valorEmCentavos,
        cupom,
      }),
    [carrinho.itens, cupom, frete.valorEmCentavos],
  );

  async function conferirCupom() {
    if (!cupom?.trim()) {
      setMensagemCupom(null);
      return;
    }

    const resultado = await validarCupomCheckout({ cupom });
    setMensagemCupom(resultado.mensagem);
  }

  async function consultarCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;
    if (cepLimpo === ultimoCepConsultado) return;

    setUltimoCepConsultado(cepLimpo);
    setBuscandoCep(true);
    setMensagemCep(null);

    const resultado = await consultarEnderecoCep(cepLimpo);

    if (!resultado.encontrado) {
      setMensagemCep(resultado.mensagem);
      setBuscandoCep(false);
      return;
    }

    form.setValue("cep", resultado.endereco.cep);
    form.setValue("rua", resultado.endereco.rua);
    form.setValue("bairro", resultado.endereco.bairro);
    form.setValue("cidade", resultado.endereco.cidade);
    form.setValue("estado", resultado.endereco.estado);

    if (resultado.endereco.complemento) {
      form.setValue("complemento", resultado.endereco.complemento);
    }

    setMensagemCep("Endereço preenchido pelo CEP");
    setBuscandoCep(false);
  }

  function finalizarCheckout(dados: CheckoutVisitanteSchema) {
    setErroPagamento(null);
    setCarregandoPagamento(true);

    criarSessaoCheckoutStripe({
      ...dados,
      cupom,
      itens: carrinho.itens,
    })
      .then((sessao) => {
        window.location.assign(sessao.url);
      })
      .catch((error) => {
        setErroPagamento(
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar o pagamento.",
        );
        setCarregandoPagamento(false);
      });
  }

  if (!carrinho.carregando && carrinho.carrinhoVazio) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12">
        <Card className="w-full rounded-lg">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Seu carrinho está vazio
            </h1>
            <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Adicione produtos ao carrinho antes de continuar para o checkout.
            </p>
            <Button className="mt-6 rounded-md" asChild>
              <Link href="/">Voltar para a loja</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Confira frete, cupom e total antes de ir para o pagamento.
        </p>
      </div>

      <form
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
        onSubmit={form.handleSubmit(finalizarCheckout)}
      >
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-8">
            <FormularioIdentificacao
              errors={form.formState.errors}
              register={form.register}
            />

            <Separator />

            <FormularioEndereco
              buscandoCep={buscandoCep}
              errors={form.formState.errors}
              mensagemCep={mensagemCep}
              register={form.register}
              setValue={form.setValue}
              onConsultarCep={consultarCep}
            />

            <Separator />

            <OpcoesFrete
              freteSelecionado={freteSelecionado}
              register={form.register}
            />

            <Separator />

            <OpcoesPagamento
              formaPagamento={formaPagamento}
              parcelasCartao={parcelasCartao}
              register={form.register}
              setValue={form.setValue}
              totalEmCentavos={totais.totalEmCentavos}
            />

            <Separator />

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <CampoCupom
                mensagemCupom={mensagemCupom}
                register={form.register}
              />

              <Button
                className="h-9 rounded-md"
                type="button"
                variant="outline"
                onClick={conferirCupom}
              >
                Aplicar
              </Button>
            </div>

            {erroPagamento ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {erroPagamento}
              </p>
            ) : null}
          </div>
        </div>

        <ResumoPedido
          carregandoPagamento={carregandoPagamento}
          formaPagamento={formaPagamento}
          itens={carrinho.itens}
          parcelasCartao={parcelasCartao}
          prazoFrete={frete.prazo}
          totais={totais}
        />
      </form>
    </main>
  );
}
