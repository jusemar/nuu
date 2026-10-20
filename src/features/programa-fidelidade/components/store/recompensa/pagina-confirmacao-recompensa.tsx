"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ItemCarrinho } from "@/features/carrinho";
import { calcularResumoCheckoutAction } from "@/features/checkout/actions/calcular-resumo-checkout";
import { consultarEnderecoCep } from "@/features/checkout/actions/consultar-endereco-cep";
import { Header } from "@/features/header";
import { criarPedidoRecompensa } from "@/features/programa-fidelidade/actions/recompensa/criar-pedido-recompensa-action";
import { chavesConsultaRecompensa } from "@/features/programa-fidelidade/constants/chaves-consulta-recompensa";
import { formatarCreditoFidelidade, formatarPontosCliente } from "@/features/programa-fidelidade/lib/formatar-fidelidade-cliente";
import type { buscarRecompensaPublicaPorSlug } from "@/features/programa-fidelidade/queries/catalogo/listar-recompensas-publicas";
import { calcularPreviaRecompensa } from "@/features/programa-fidelidade/queries/previa-recompensa/calcular-previa-recompensa";
import { type ConfirmacaoRecompensa,confirmacaoRecompensaSchema } from "@/features/programa-fidelidade/schemas/confirmacao-recompensa.schema";

type Recompensa = NonNullable<Awaited<ReturnType<typeof buscarRecompensaPublicaPorSlug>>>;
type Cliente = {
  nome: string; email: string; telefone: string; documento: string;
  endereco: Pick<ConfirmacaoRecompensa, "cep" | "rua" | "numero" | "complemento" | "bairro" | "cidade" | "estado">;
};

function criarItemRecompensa(recompensa: Recompensa, varianteId: string,
  selecoes: ConfirmacaoRecompensa["selecoesEntregaPorGrupo"]): ItemCarrinho | null {
  const variante = recompensa.produtoVariavel
    ? recompensa.variantes.find((atual) => atual.id === varianteId) : null;
  if (recompensa.produtoVariavel && !variante) return null;
  const entrega = selecoes[0];
  return {
    id: `recompensa-${recompensa.id}-${variante?.id ?? "simples"}`,
    produtoId: recompensa.id,
    produtoVarianteId: variante?.id,
    produtoSlug: recompensa.slug,
    nome: recompensa.nome,
    sku: variante?.sku ?? recompensa.sku,
    modalidadeTipo: recompensa.modalidadeTipo,
    variante: variante?.nome,
    imagemUrl: variante?.imagemUrl || recompensa.imagemUrl || "/produto-sem-foto.webp",
    precoEmCentavos: variante?.precoInternoEmCentavos ?? recompensa.precoInternoEmCentavos,
    quantidade: 1,
    freteEscolhido: entrega ? {
      id: entrega.tipo === "retirada" ? "retirada" :
        entrega.provedor === "entrega-propria" ? "entrega-propria" : "frenet",
      nome: entrega.nome, prazo: entrega.descricao || "Consulte prazo",
      valorEmCentavos: entrega.valorEmCentavos, cep: entrega.cep,
      servico: entrega.servico,
    } : {
      id: "retirada", nome: "Entrega a definir", prazo: "Consulte as opções",
      valorEmCentavos: 0,
    },
  };
}

function mensagemErroRecompensa(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : "";
  if (/SALDO_FIDELIDADE|CONCORRENTE/.test(mensagem)) return "Seu saldo mudou. Confira a prévia novamente.";
  if (/ESTOQUE|Variante|Produto indisponível/.test(mensagem)) return "Esta recompensa está indisponível no momento.";
  if (/FRETE|entrega|cotação/i.test(mensagem)) return "A entrega mudou. Selecione uma opção novamente.";
  if (/PRODUTO_NAO_ELEGIVEL|CUSTO_RECOMPENSA/.test(mensagem)) return "O custo ou a disponibilidade desta recompensa mudou.";
  if (/CLIENTE_AUTENTICADO/.test(mensagem)) return "Entre na sua conta para continuar.";
  return "Não foi possível concluir o resgate. Confira os dados e tente novamente.";
}

export function PaginaConfirmacaoRecompensa({ recompensa, cliente }: { recompensa: Recompensa; cliente: Cliente }) {
  const roteador = useRouter();
  const clienteConsulta = useQueryClient();
  const chaveIdempotencia = useRef<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState<{ pedidoId: string; numeroPedido: string | null } | null>(null);
  const formulario = useForm<ConfirmacaoRecompensa>({
    resolver: zodResolver(confirmacaoRecompensaSchema), mode: "onChange",
    defaultValues: { ...cliente.endereco,
      varianteId: recompensa.produtoVariavel ? recompensa.variantes[0]?.id ?? "" : "",
      selecoesEntregaPorGrupo: [],
    },
  });
  const { setValue } = formulario;
  const varianteId = useWatch({ control: formulario.control, name: "varianteId" });
  const cep = useWatch({ control: formulario.control, name: "cep" });
  const cidade = useWatch({ control: formulario.control, name: "cidade" });
  const estado = useWatch({ control: formulario.control, name: "estado" });
  const selecoes = useWatch({ control: formulario.control, name: "selecoesEntregaPorGrupo" }) ?? [];
  const cepLimpo = (cep ?? "").replace(/\D/g, "");
  const item = criarItemRecompensa(recompensa, varianteId ?? "", selecoes);

  useEffect(() => {
    setValue("selecoesEntregaPorGrupo", []);
  }, [cepLimpo, varianteId, setValue]);

  const cotacao = useQuery({
    queryKey: chavesConsultaRecompensa.cotacao(recompensa.id, varianteId ?? "", cepLimpo),
    enabled: cepLimpo.length === 8 && item !== null,
    queryFn: () => calcularResumoCheckoutAction({ itens: [item!], cepEntrega: cepLimpo }),
    retry: false,
  });
  const cotacoes = cotacao.data?.cotacoesEntrega ?? [];
  const todasSelecionadas = cotacoes.length > 0 &&
    cotacoes.every((grupo) => selecoes.some((selecao) => selecao.chaveGrupo === grupo.chaveGrupo));
  const previa = useQuery({
    queryKey: chavesConsultaRecompensa.previa(recompensa.id, varianteId ?? "", cepLimpo,
      cidade ?? "", estado ?? "", selecoes),
    enabled: Boolean(item && cepLimpo.length === 8 && (cidade?.length ?? 0) >= 2 &&
      (estado?.length ?? 0) === 2 && todasSelecionadas),
    queryFn: () => calcularPreviaRecompensa({ item: item!, cep: cepLimpo,
      cidade: cidade!, estado: estado!, selecoesEntregaPorGrupo: selecoes }),
    retry: false,
  });

  async function preencherCep() {
    const resultado = await consultarEnderecoCep(cepLimpo);
    if (!resultado.encontrado) { setMensagem(resultado.mensagem); return; }
    for (const campo of ["rua", "complemento", "bairro", "cidade", "estado"] as const) {
      formulario.setValue(campo, resultado.endereco[campo], { shouldValidate: true });
    }
    setMensagem(null);
  }

  async function confirmar(dados: ConfirmacaoRecompensa) {
    if (!item || !previa.data || !previa.data.podeResgatar) return;
    setMensagem(null); setProcessando(true);
    try {
      // Uma nova leitura permite avisar sobre custo, saldo ou frete alterados antes do clique final.
      const atual = await calcularPreviaRecompensa({ item, cep: dados.cep, cidade: dados.cidade,
        estado: dados.estado, selecoesEntregaPorGrupo: dados.selecoesEntregaPorGrupo });
      if (atual.custoPontos !== previa.data.custoPontos ||
        atual.saldoDisponivel !== previa.data.saldoDisponivel ||
        atual.totalMonetarioEmCentavos !== previa.data.totalMonetarioEmCentavos) {
        setMensagem("Seus pontos ou a entrega mudaram. Confira os valores atualizados antes de confirmar.");
        await clienteConsulta.invalidateQueries({ queryKey: ["recompensa", "previa"] });
        return;
      }
      if (!atual.podeResgatar) { setMensagem("Pontos insuficientes para este resgate."); return; }
      chaveIdempotencia.current ??= crypto.randomUUID();
      const pedido = await criarPedidoRecompensa({
        ...dados, nome: cliente.nome, email: cliente.email, telefone: cliente.telefone,
        documento: cliente.documento, formaPagamento: "pix", itens: [item],
        chaveIdempotencia: chaveIdempotencia.current,
      });
      if (pedido.totalEmCentavos > 0) {
        roteador.push(`/minha-conta/pedidos/${pedido.pedidoId}/pix`);
      } else {
        setSucesso({ pedidoId: pedido.pedidoId,
          numeroPedido: "numeroPedido" in pedido ? pedido.numeroPedido ?? null : null });
      }
    } catch (erro) {
      setMensagem(mensagemErroRecompensa(erro));
      await clienteConsulta.invalidateQueries({ queryKey: ["recompensa", "previa"] });
    } finally { setProcessando(false); }
  }

  if (sucesso) return <><Header /><main className="mx-auto max-w-xl px-4 py-16 text-center">
    <Card><CardContent className="space-y-4 p-8">
      <Gift className="mx-auto size-12 text-[#0C447C]" />
      <h1 className="text-2xl font-semibold">Resgate realizado!</h1>
      <p>Seu pedido foi criado com sucesso.</p>
      <p className="text-sm text-slate-600">Pedido {sucesso.numeroPedido ?? sucesso.pedidoId}</p>
      <Button asChild><Link href={`/minha-conta/pedidos/${sucesso.pedidoId}`}>Ver meu pedido</Link></Button>
    </CardContent></Card>
  </main></>;

  return <><Header /><main className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <Button variant="ghost" asChild><Link href="/troque-seus-pontos"><ArrowLeft className="mr-2 size-4" />Recompensas</Link></Button>
      <header><h1 className="text-3xl font-semibold text-slate-950">Confirmar resgate</h1>
        <p className="mt-2 text-sm text-slate-600">Confira seus pontos e escolha a entrega.</p></header>
      <form onSubmit={formulario.handleSubmit(confirmar)} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card><CardContent className="flex gap-4 p-5">
            <div className="relative size-24 shrink-0 rounded-lg bg-slate-100 sm:size-32">
              <Image src={recompensa.imagemUrl || "/produto-sem-foto.webp"} alt={recompensa.nome} fill
                sizes="128px" className="object-contain p-2" />
            </div><div className="space-y-2"><h2 className="text-lg font-semibold">{recompensa.nome}</h2>
              <p className="font-semibold text-[#0C447C]">{formatarPontosCliente(previa.data?.custoPontos ?? recompensa.custoPontos)} pontos</p>
              <p className="text-sm text-slate-600">Quantidade: 1</p></div>
          </CardContent></Card>
          {recompensa.produtoVariavel ? <Card><CardHeader><CardTitle>Variante</CardTitle></CardHeader><CardContent>
            <Label htmlFor="variante-recompensa">Escolha uma variante</Label>
            <select id="variante-recompensa" {...formulario.register("varianteId")}
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
              {recompensa.variantes.map((variante) => <option key={variante.id} value={variante.id}>{variante.nome}</option>)}
            </select>
          </CardContent></Card> : null}
          <Card><CardHeader><CardTitle>Endereço e entrega</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {([ ["cep", "CEP"], ["rua", "Rua"], ["numero", "Número"], ["complemento", "Complemento"],
                ["bairro", "Bairro"], ["cidade", "Cidade"], ["estado", "UF"] ] as const).map(([campo, rotulo]) =>
                <div key={campo} className={campo === "rua" ? "sm:col-span-2" : ""}>
                  <Label htmlFor={`recompensa-${campo}`}>{rotulo}</Label>
                  <Input id={`recompensa-${campo}`} {...formulario.register(campo)} className="mt-1" />
                  {formulario.formState.errors[campo] ? <p className="mt-1 text-xs text-red-700">{formulario.formState.errors[campo]?.message}</p> : null}
                </div>)}
            </div>
            <Button type="button" variant="outline" onClick={preencherCep} disabled={cepLimpo.length !== 8}>Preencher pelo CEP</Button>
            <fieldset className="space-y-3"><legend className="text-sm font-semibold">Forma de entrega</legend>
              {cotacao.isPending && cepLimpo.length === 8 ? <p className="text-sm text-slate-600">Calculando entrega...</p> : null}
              {cotacao.isError ? <p role="alert" className="text-sm text-red-700">Não foi possível calcular a entrega. Confira o CEP.</p> : null}
              {cotacoes.map((grupo) => <div key={grupo.chaveGrupo} className="space-y-2">
                {grupo.opcoes.map((opcao) => {
                  const selecionada = selecoes.some((selecao) => selecao.chaveGrupo === grupo.chaveGrupo &&
                    selecao.identificador === opcao.identificador);
                  return <label key={opcao.identificador} className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3">
                    <input type="radio" name={`entrega-${grupo.chaveGrupo}`} checked={selecionada} className="mt-1"
                      onChange={() => formulario.setValue("selecoesEntregaPorGrupo", [
                        ...selecoes.filter((atual) => atual.chaveGrupo !== grupo.chaveGrupo),
                        { ...opcao, chaveGrupo: grupo.chaveGrupo, cep: cepLimpo },
                      ], { shouldValidate: true })} />
                    <span className="flex-1"><span className="block text-sm font-medium">{opcao.nome}</span>
                      {opcao.descricao ? <span className="text-xs text-slate-600">{opcao.descricao}</span> : null}</span>
                    <span className="text-sm font-semibold">{opcao.valorEmCentavos === 0 ? "Grátis" :
                      formatarCreditoFidelidade(opcao.valorEmCentavos)}</span>
                  </label>;
                })}
                {grupo.mensagemErro ? <p role="alert" className="text-sm text-amber-800">{grupo.mensagemErro}</p> : null}
              </div>)}
              {cepLimpo.length !== 8 ? <p className="text-sm text-slate-600">Informe um CEP completo para ver as opções.</p> : null}
              {formulario.formState.errors.selecoesEntregaPorGrupo ? <p className="text-xs text-red-700">Selecione uma forma de entrega.</p> : null}
            </fieldset>
          </CardContent></Card>
        </div>
        <Card className="h-fit lg:sticky lg:top-6"><CardHeader><CardTitle>Resumo do resgate</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {previa.isFetching ? <p className="text-slate-600">Atualizando prévia...</p> : null}
            {previa.isError ? <p role="alert" className="text-red-700">A recompensa ou a entrega mudou. Revise sua escolha.</p> : null}
            {previa.data ? <>
              <p>Seu saldo: <strong>{formatarPontosCliente(previa.data.saldoDisponivel)} pontos</strong></p>
              <p>Produto: <strong>{formatarPontosCliente(previa.data.custoPontos)} pontos</strong></p>
              {previa.data.podeResgatar ? <p>Após o resgate: <strong>{formatarPontosCliente(previa.data.saldoAposResgate!)} pontos</strong></p>
                : <p className="text-amber-800">Faltam {formatarPontosCliente(previa.data.pontosFaltantes)} pontos</p>}
              <div className="border-t pt-4"><p>Frete: <strong>{previa.data.freteEmCentavos === 0 ? "Frete grátis" :
                formatarCreditoFidelidade(previa.data.freteEmCentavos)}</strong></p>
                <p className="mt-2 text-base font-semibold">Total a pagar: {formatarCreditoFidelidade(previa.data.totalMonetarioEmCentavos)}</p></div>
              {previa.data.totalMonetarioEmCentavos > 0 ? <p className="text-xs text-slate-600">O pagamento PIX cobre somente o frete.</p> : null}
            </> : <p className="text-slate-600">Escolha a entrega para consultar seus pontos e o total real.</p>}
            {mensagem ? <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900">{mensagem}</p> : null}
            <Button type="submit" className="w-full" disabled={processando || previa.isFetching ||
              !previa.data?.podeResgatar || !formulario.formState.isValid}>
              {processando ? "Confirmando..." : "Confirmar resgate"}
            </Button>
          </CardContent></Card>
      </form>
    </div>
  </main></>;
}
