"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCarrinho } from "@/features/carrinho";
import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";

import { calcularResumoCheckoutAction } from "../../../actions/calcular-resumo-checkout";
import { consultarEnderecoCep } from "../../../actions/consultar-endereco-cep";
import { criarPedidoCheckoutVisitante } from "../../../actions/pedido/criar-pedido-checkout-visitante";
import { validarCupomCheckout } from "../../../actions/validar-cupom-checkout";
import {
  reconciliarSelecoesEntregaPorGrupo,
  todasEntregasSelecionadas,
} from "../../../lib/frete/selecoes-entrega-por-grupo";
import {
  calcularPreviaTotaisPedido,
  type ResultadoCalcularPreviaTotaisPedido,
} from "../../../queries/previa-totais/calcular-previa-totais-pedido";
import {
  type CheckoutVisitanteSchema,
  checkoutVisitanteSchema,
} from "../../../schemas/checkout.schema";
import type {
  ResumoCheckoutCalculado,
  SelecaoEntregaGrupoCheckout,
} from "../../../types/checkout.types";
import { FormularioEndereco } from "./formulario-endereco";
import { FormularioIdentificacao } from "./formulario-identificacao";
import { PagamentoPixPendente } from "./pagamento-pix-pendente";
import { ResumoPedido } from "./resumo-pedido";
import { RevisaoProdutosEntrega } from "./revisao-pedido/revisao-produtos-entrega";

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

export type DadosCheckoutClienteInicial = {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacaoCliente: string;
  permitirEntregaVizinho: boolean;
  nomeVizinho: string;
  observacaoVizinho: string;
};

export function CheckoutVisitante({
  dadosClienteInicial,
}: {
  dadosClienteInicial?: DadosCheckoutClienteInicial;
}) {
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
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const [resumoCheckout, setResumoCheckout] =
    useState<ResumoCheckoutCalculado | null>(null);
  const [selecoesEntrega, setSelecoesEntrega] = useState<
    SelecaoEntregaGrupoCheckout[]
  >([]);
  const selecoesEntregaRef = useRef<SelecaoEntregaGrupoCheckout[]>([]);
  selecoesEntregaRef.current = selecoesEntrega;
  const [tentouFinalizar, setTentouFinalizar] = useState(false);
  const [previaTotaisPedido, setPreviaTotaisPedido] =
    useState<ResultadoCalcularPreviaTotaisPedido | null>(null);
  const [pixCriado, setPixCriado] = useState<PixCriado | null>(null);

  const form = useForm<CheckoutVisitanteSchema>({
    resolver: zodResolver(checkoutVisitanteSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      nome: dadosClienteInicial?.nome ?? "",
      email: dadosClienteInicial?.email ?? "",
      telefone: dadosClienteInicial?.telefone ?? "",
      documento: dadosClienteInicial?.documento ?? "",
      cep: dadosClienteInicial?.cep ?? "",
      rua: dadosClienteInicial?.rua ?? "",
      numero: dadosClienteInicial?.numero ?? "",
      complemento: dadosClienteInicial?.complemento ?? "",
      bairro: dadosClienteInicial?.bairro ?? "",
      cidade: dadosClienteInicial?.cidade ?? "",
      estado: dadosClienteInicial?.estado ?? "",
      observacao: "",
      observacaoCliente: dadosClienteInicial?.observacaoCliente ?? "",
      cupom: "",
      pontosResgate: "",
      formaPagamento: "pix",
      parcelasCartao: 1,
      permitirEntregaVizinho:
        dadosClienteInicial?.permitirEntregaVizinho ?? false,
      nomeVizinho: dadosClienteInicial?.nomeVizinho ?? "",
      observacaoVizinho: dadosClienteInicial?.observacaoVizinho ?? "",
      itens: [],
      selecoesEntregaPorGrupo: [],
    },
  });
  const { setValue } = form;
  const assinaturaItensCarrinho = useMemo(
    () => JSON.stringify(carrinho.itens),
    [carrinho.itens],
  );
  const assinaturaItensSincronizadaRef = useRef<string | undefined>(undefined);
  const cepEntrega = form.watch("cep");
  const cidadeEntrega = form.watch("cidade");
  const estadoEntrega = form.watch("estado");

  const formaPagamento = form.watch("formaPagamento");
  const parcelasCartao = form.watch("parcelasCartao");
  const formaPagamentoNaEntrega = form.watch("formaPagamentoNaEntrega");
  const precisaTroco = form.watch("precisaTroco");
  const trocoParaEmCentavos = form.watch("trocoParaEmCentavos");
  const cupom = form.watch("cupom");
  const pontosResgate = form.watch("pontosResgate");
  const freteSelecionadoEmCentavos =
    resumoCheckout?.totaisPorFormaPagamento.pix.freteEmCentavos ?? null;
  const assinaturaSelecoesEntrega = useMemo(
    () => JSON.stringify(selecoesEntrega),
    [selecoesEntrega],
  );

  /**
   * CEP só quando está completo.
   *
   * O resumo é recalculado no servidor, e `cepEntrega` muda a cada tecla digitada. Depender
   * do valor cru dispararia oito consultas para um CEP completo — sete delas com um CEP que
   * nem existe. Reduzindo a um valor que só muda quando os 8 dígitos estão presentes, o
   * recálculo acontece uma vez.
   */
  const cepEntregaCompleto = (() => {
    const digitos = (cepEntrega ?? "").replace(/\D/g, "");
    return digitos.length === 8 ? digitos : null;
  })();

  /**
   * Chave de idempotência da tentativa de compra.
   *
   * Gerada uma única vez por montagem do checkout e reenviada em toda tentativa. Se o
   * cliente clicar duas vezes, ou a rede repetir a requisição, o servidor reconhece a
   * chave e devolve o pedido que já criou em vez de criar outro.
   *
   * `useState` com inicializador em vez de `useMemo`: `useMemo` pode ser descartado e
   * recalculado pelo React, e uma chave nova anularia exatamente a proteção que ela existe
   * para dar.
   */
  const [chaveIdempotencia] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  useEffect(() => {
    // O formulário valida os dados; o carrinho continua sendo fonte do domínio carrinho.
    if (assinaturaItensSincronizadaRef.current === assinaturaItensCarrinho) {
      return;
    }
    assinaturaItensSincronizadaRef.current = assinaturaItensCarrinho;
    setValue("itens", carrinho.itens);
  }, [assinaturaItensCarrinho, carrinho.itens, setValue]);

  useEffect(() => {
    let consultaCancelada = false;

    if (carrinho.itens.length === 0) {
      setResumoCheckout(null);
      return;
    }

    setCarregandoResumo(true);
    calcularResumoCheckoutAction({
      itens: carrinho.itens,
      cupom,
      cepEntrega: cepEntregaCompleto,
      selecoesEntregaPorGrupo: selecoesEntregaRef.current,
    })
      .then((resumo) => {
        if (consultaCancelada) return;

        setResumoCheckout(resumo);

        if (resumo && !resumo.pagamentos[formaPagamento].ativo) {
          const proximaForma = resumo.pagamentos.pix.ativo ? "pix" : "cartao";
          setValue("formaPagamento", proximaForma, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        const primeiraParcela = resumo?.pagamentos.cartao.parcelamentos[0];
        if (primeiraParcela && !parcelasCartao) {
          setValue("parcelasCartao", primeiraParcela.parcelas, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      })
      .catch((error) => {
        if (consultaCancelada) return;
        setResumoCheckout(null);
        setErroPagamento(
          error instanceof Error
            ? error.message
            : "Não foi possível calcular o resumo do pedido.",
        );
      })
      .finally(() => {
        if (!consultaCancelada) setCarregandoResumo(false);
      });

    return () => {
      consultaCancelada = true;
    };
    // `cepEntregaCompleto` e não o CEP cru: ver o comentário na derivação acima.
  }, [
    carrinho.itens,
    cepEntregaCompleto,
    cupom,
    formaPagamento,
    parcelasCartao,
    assinaturaSelecoesEntrega,
    setValue,
  ]);

  useEffect(() => {
    if (!resumoCheckout || !cepEntregaCompleto) {
      if (selecoesEntregaRef.current.length > 0) {
        setSelecoesEntrega([]);
        setValue("selecoesEntregaPorGrupo", []);
      }
      return;
    }

    const selecoesAtuais = selecoesEntregaRef.current;
    let reconciliadas = reconciliarSelecoesEntregaPorGrupo({
      cotacoes: resumoCheckout.cotacoesEntrega,
      selecoesAtuais,
      cep: cepEntregaCompleto,
    });

    if (selecoesAtuais.length === 0) {
      reconciliadas = resumoCheckout.cotacoesEntrega.flatMap((cotacao) => {
        const grupo = resumoCheckout.gruposLogisticos.find(
          (atual) => atual.chave === cotacao.chaveGrupo,
        );
        const itemCarrinho = carrinho.itens.find((item) =>
          grupo?.itens.some((itemGrupo) => itemGrupo.id === item.id),
        );
        const anterior = itemCarrinho?.freteEscolhido;
        const opcao = anterior
          ? cotacao.opcoes.find(
              (atual) =>
                atual.provedor === anterior.id &&
                (!anterior.servico || atual.servico === anterior.servico),
            )
          : null;
        return opcao
          ? [
              {
                ...opcao,
                chaveGrupo: cotacao.chaveGrupo,
                cep: cepEntregaCompleto,
              },
            ]
          : [];
      });
    }

    if (JSON.stringify(reconciliadas) !== JSON.stringify(selecoesAtuais)) {
      setSelecoesEntrega(reconciliadas);
      setValue("selecoesEntregaPorGrupo", reconciliadas, {
        shouldValidate: true,
      });
    }
  }, [carrinho.itens, cepEntregaCompleto, resumoCheckout, setValue]);

  useEffect(() => {
    let consultaCancelada = false;

    if (carrinho.itens.length === 0) {
      setPreviaTotaisPedido(null);
      return;
    }

    calcularPreviaTotaisPedido({
      itens: carrinho.itens,
      codigoCupom: cupom,
      cepEntrega,
      cidadeEntrega,
      estadoEntrega,
      freteEmCentavosOficial: freteSelecionadoEmCentavos,
      consultarFidelidade: true,
      pontosResgate: pontosResgate || undefined,
      formaPagamento,
      parcelasCartao,
    })
      .then((previa) => {
        if (!consultaCancelada) {
          setPreviaTotaisPedido(previa);
        }
      })
      .catch(() => {
        if (!consultaCancelada) {
          setPreviaTotaisPedido(null);
        }
      });

    return () => {
      consultaCancelada = true;
    };
  }, [
    carrinho.itens,
    cupom,
    cepEntrega,
    cidadeEntrega,
    estadoEntrega,
    freteSelecionadoEmCentavos,
    formaPagamento,
    pontosResgate,
    parcelasCartao,
  ]);

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
    setTentouFinalizar(true);
    if (
      !resumoCheckout ||
      !todasEntregasSelecionadas({
        cotacoes: resumoCheckout.cotacoesEntrega,
        selecoes: selecoesEntrega,
      })
    ) {
      setErroPagamento(
        "Selecione uma forma de entrega para todas as entregas.",
      );
      return;
    }

    setErroPagamento(null);
    setCarregandoPagamento(true);

    criarPedidoCheckoutVisitante({
      ...dados,
      cupom,
      itens: carrinho.itens,
      chaveIdempotencia,
      selecoesEntregaPorGrupo: selecoesEntrega,
    })
      .then((pedido) => {
        setCarregandoPagamento(false);

        // Pagamento na entrega não passa por gateway: o carrinho é limpo aqui, junto com
        // o redirecionamento. Sem isto o cliente voltaria à loja com o carrinho cheio de
        // itens que já viraram pedido.
        if (dados.formaPagamento === "naEntrega") {
          carrinho.limparCarrinho();
          router.push(
            `/checkout/success?pedido=${encodeURIComponent(pedido.numeroPedido)}`,
          );
          return;
        }

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
      <div className="bg-background text-foreground min-h-screen">
        <header className="border-border sticky top-0 z-40 border-b bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
                <span className="text-sm font-bold text-white">
                  {DADOS_EMPRESA.iniciaisMarca}
                </span>
              </div>
              <div>
                <span className="block text-[17px] font-bold text-zinc-800">
                  {DADOS_EMPRESA.marca}
                </span>
                <span className="block text-[11px] text-zinc-500">
                  Sua loja
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Lock className="size-3.5" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                Ambiente seguro
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12">
          <Card className="border-border bg-card shadow-card w-full rounded-2xl border">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center">
              <h1 className="text-foreground text-xl font-semibold">
                Seu carrinho está vazio
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Adicione produtos ao carrinho antes de continuar para o
                checkout.
              </p>
              <Button
                className="bg-primary mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold"
                asChild
              >
                <Link href="/">Voltar para a loja</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="border-border sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
              <span className="text-sm font-bold text-white">
                {DADOS_EMPRESA.iniciaisMarca}
              </span>
            </div>
            <div>
              <span className="block text-[17px] font-bold text-zinc-800">
                {DADOS_EMPRESA.marca}
              </span>
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
                    {s.done ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      s.n
                    )}
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
                {i < steps.length - 1 && <div className="bg-border h-px w-6" />}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 text-emerald-600">
            <Lock className="size-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              Ambiente seguro
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Finalizar pedido
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Revise o pedido, confirme seus dados e escolha a forma de pagamento.
            Tudo em ambiente criptografado.
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

            <RevisaoProdutosEntrega
              freteGratisProgressivo={
                previaTotaisPedido?.freteGratisProgressivo
              }
              resumoCheckout={resumoCheckout}
              selecoesEntrega={selecoesEntrega}
              cepEntrega={cepEntregaCompleto ?? ""}
              mostrarErrosSelecao={tentouFinalizar}
              onSelecionarEntrega={(selecao) => {
                const proximas = [
                  ...selecoesEntrega.filter(
                    (atual) => atual.chaveGrupo !== selecao.chaveGrupo,
                  ),
                  selecao,
                ];
                setSelecoesEntrega(proximas);
                setValue("selecoesEntregaPorGrupo", proximas, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              onRemoverItem={carrinho.removerItem}
            />

            {carregandoResumo ? (
              <div className="border-border bg-card text-muted-foreground rounded-lg border p-3 text-sm">
                Atualizando resumo do pedido...
              </div>
            ) : null}

            {erroPagamento ? (
              <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                {erroPagamento}
              </div>
            ) : null}
          </div>

          <ResumoPedido
            carregandoPagamento={carregandoPagamento}
            formaPagamento={formaPagamento}
            formaPagamentoNaEntrega={formaPagamentoNaEntrega}
            precisaTroco={precisaTroco}
            trocoParaEmCentavos={trocoParaEmCentavos}
            itens={carrinho.itens}
            parcelasCartao={parcelasCartao}
            resumoCheckout={resumoCheckout}
            cupom={cupom ?? ""}
            register={form.register}
            setValue={form.setValue}
            mensagemCupom={mensagemCupom}
            previaTotais={previaTotaisPedido}
            onCupomChange={(value) =>
              form.setValue("cupom", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onAplicarCupom={conferirCupom}
            onPreviaTotaisChange={setPreviaTotaisPedido}
            isFormValid={form.formState.isValid}
            entregasSelecionadas={
              resumoCheckout !== null &&
              todasEntregasSelecionadas({
                cotacoes: resumoCheckout.cotacoesEntrega,
                selecoes: selecoesEntrega,
              })
            }
          />
        </form>
      </main>

      <footer className="border-border bg-card mt-16 border-t py-8">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs md:flex-row">
          <p>
            © {new Date().getFullYear()} {DADOS_EMPRESA.marca}
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              Termos
            </a>
            <a href="#" className="hover:text-foreground">
              Privacidade
            </a>
            <a href="#" className="hover:text-foreground">
              Segurança
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
