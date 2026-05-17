"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCarrinho } from "@/features/carrinho";

import { consultarEnderecoCep } from "../../../actions/consultar-endereco-cep";
import { criarPedidoCheckoutVisitante } from "../../../actions/pedido/criar-pedido-checkout-visitante";
import { validarCupomCheckout } from "../../../actions/validar-cupom-checkout";
import { calcularFreteCheckout } from "../../../lib/calcular-frete-checkout";
import { calcularTotalCheckout } from "../../../lib/calcular-total-checkout";
import {
  checkoutVisitanteSchema,
  type CheckoutVisitanteSchema,
} from "../../../schemas/checkout.schema";
import { FormularioEndereco } from "./formulario-endereco";
import { FormularioIdentificacao } from "./formulario-identificacao";
import { OpcoesFrete } from "./opcoes-frete";
import { OpcoesPagamento } from "./opcoes-pagamento";
import { PagamentoPixPendente } from "./pagamento-pix-pendente";
import { ResumoPedido } from "./resumo-pedido";

const steps = [
  { n: 1, label: "Carrinho", done: true },
  { n: 2, label: "Dados & Entrega", done: false, current: true },
  { n: 3, label: "Confirmação", done: false },
];

type PixCriado = {
  numeroPedido: string;
  totalEmCentavos: number;
  pix: {
    qrCode: string;
    copiaECola: string;
    expiresAt: string;
  };
};

export function CheckoutVisitante() {
  const router = useRouter();
  const carrinho = useCarrinho();
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [mensagemCupom, setMensagemCupom] = useState<string | null>(null);
  const [mensagemCep, setMensagemCep] = useState<string | null>(null);
  const [ultimoCepConsultado, setUltimoCepConsultado] = useState<string | null>(
    null,
  );
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [pixCriado, setPixCriado] = useState<PixCriado | null>(null);

  const form = useForm<CheckoutVisitanteSchema>({
    resolver: zodResolver(checkoutVisitanteSchema),
    mode: "onChange",
    reValidateMode: "onChange",
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

    criarPedidoCheckoutVisitante({
      ...dados,
      cupom,
      itens: carrinho.itens,
    })
      .then((pedido) => {
        setCarregandoPagamento(false);

        if ("pix" in pedido && pedido.pix) {
          carrinho.limparCarrinho();
          setPixCriado({
            numeroPedido: pedido.numeroPedido,
            totalEmCentavos: pedido.totalEmCentavos,
            pix: pedido.pix,
          });
          return;
        }

        if ("stripe" in pedido && pedido.stripe) {
          window.location.assign(pedido.stripe.url);
          return;
        }

        router.push(
          `/checkout/success?pedido=${encodeURIComponent(pedido.numeroPedido)}`,
        );
      })
      .catch((error) => {
        setErroPagamento(
          error instanceof Error
            ? error.message
            : "Não foi possível criar o pedido.",
        );
        setCarregandoPagamento(false);
      });
  }

  if (pixCriado) {
    return (
      <PagamentoPixPendente
        numeroPedido={pixCriado.numeroPedido}
        totalEmCentavos={pixCriado.totalEmCentavos}
        qrCode={pixCriado.pix.qrCode}
        copiaECola={pixCriado.pix.copiaECola}
        expiresAt={pixCriado.pix.expiresAt}
      />
    );
  }

if (!carrinho.carregando && carrinho.carrinhoVazio) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm bg-primary">
                <span className="text-sm font-bold text-white">DR</span>
              </div>
              <div>
                <span className="block text-[17px] font-bold text-zinc-800">Do Rocha</span>
                <span className="block text-[11px] text-zinc-500">Sua loja</span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Lock className="size-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ambiente seguro</span>
            </div>
          </div>
        </header>
        <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12">
          <Card className="w-full rounded-2xl border border-border bg-card shadow-card">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center">
              <h1 className="text-xl font-semibold text-foreground">
                Seu carrinho está vazio
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Adicione produtos ao carrinho antes de continuar para o checkout.
              </p>
              <Button className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold" asChild>
                <Link href="/">Voltar para a loja</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm bg-primary">
              <span className="text-sm font-bold text-white">DR</span>
            </div>
            <div>
              <span className="block text-[17px] font-bold text-zinc-800">Do Rocha</span>
              <span className="block text-[11px] text-zinc-500">Sua loja</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "flex size-6 items-center justify-center rounded-full text-[11px] font-bold " +
                      (s.done
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : s.current
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground")
                    }
                  >
                    {s.done ? <Check className="size-3" strokeWidth={3} /> : s.n}
                  </span>
                  <span
                    className={
                      "text-xs font-medium " +
                      (s.current ? "text-foreground" : "text-muted-foreground")
                    }
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 text-emerald-600">
            <Lock className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ambiente seguro</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Finalizar pedido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirme seus dados, escolha frete e pagamento. Tudo em ambiente criptografado.
          </p>
        </div>

        <form
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
          onSubmit={form.handleSubmit(finalizarCheckout)}
        >
          {/* LEFT — Form */}
          <div className="space-y-6 lg:col-span-7">
            <FormularioIdentificacao control={form.control} />

            <FormularioEndereco
              buscandoCep={buscandoCep}
              errors={form.formState.errors}
              mensagemCep={mensagemCep}
              register={form.register}
              setValue={form.setValue}
              watch={form.watch}
              onConsultarCep={consultarCep}
            />

            <OpcoesFrete
              freteSelecionado={freteSelecionado}
              register={form.register}
            />

            <OpcoesPagamento
              formaPagamento={formaPagamento}
              parcelasCartao={parcelasCartao}
              register={form.register}
              setValue={form.setValue}
              totalEmCentavos={totais.totalEmCentavos}
            />

            {erroPagamento ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {erroPagamento}
              </div>
            ) : null}
          </div>

          <ResumoPedido
            carregandoPagamento={carregandoPagamento}
            formaPagamento={formaPagamento}
            itens={carrinho.itens}
            parcelasCartao={parcelasCartao}
            prazoFrete={frete.prazo}
            totais={totais}
            cupom={cupom}
            mensagemCupom={mensagemCupom}
            onCupomChange={(value) => form.setValue("cupom", value)}
            onAplicarCupom={conferirCupom}
            isFormValid={form.formState.isValid}
          />
        </form>
      </main>

      <footer className="mt-16 border-t border-border bg-card py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 NUU STORE</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Segurança</a>
          </div>
        </div>
      </footer>
    </div>
);
}
