import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Megaphone,
  Package,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCards } from "@/components/ui/section-cards";
import { GraficoDesempenhoNegocio } from "@/features/admin/components/grafico-desempenho-negocio";
import { auditarLogisticaProdutos } from "@/features/logistica/queries/listar-diagnosticos-logisticos-produtos";

const alertasEstaticos = [
  {
    titulo: "8 produtos com estoque crítico",
    descricao: "Itens de alta saída podem ficar indisponíveis ainda hoje.",
    destino: "/admin/products",
    prioridade: "Atenção",
    icon: Package,
    tom: "aviso",
  },
  {
    titulo: "3 pedidos aguardando ação",
    descricao: "O prazo de separação termina nas próximas duas horas.",
    destino: "/admin/orders",
    prioridade: "Urgente",
    icon: ShoppingCart,
    tom: "urgente",
  },
] as const;

const pedidosRecentes = [
  {
    codigo: "#1048",
    cliente: "Mariana Alves",
    valor: "R$ 489,90",
    estado: "Pago",
  },
  {
    codigo: "#1047",
    cliente: "Lucas Ribeiro",
    valor: "R$ 218,40",
    estado: "Separação",
  },
  {
    codigo: "#1046",
    cliente: "Carla Mendes",
    valor: "R$ 764,00",
    estado: "Enviado",
  },
  {
    codigo: "#1045",
    cliente: "Rafael Souza",
    valor: "R$ 159,80",
    estado: "Pago",
  },
] as const;

const produtosCriticos = [
  { nome: "Capacete Urban Pro", sku: "CAP-URB-01", quantidade: 2 },
  { nome: "Luva Touring X", sku: "LUV-TOU-09", quantidade: 3 },
  { nome: "Jaqueta Storm", sku: "JAQ-STO-12", quantidade: 4 },
  { nome: "Bota Adventure", sku: "BOT-ADV-07", quantidade: 5 },
] as const;

const modulos = [
  {
    titulo: "Marketing",
    descricao: "4 campanhas ativas",
    detalhe: "Conversão estável esta semana",
    destino: "/admin/marketing/promocoes",
    icon: Megaphone,
  },
  {
    titulo: "Financeiro",
    descricao: "R$ 9.840 a receber",
    detalhe: "Fluxo dentro do esperado",
    destino: "/admin/precificacao",
    icon: CircleDollarSign,
  },
  {
    titulo: "Clientes",
    descricao: "+38 novos clientes",
    detalhe: "12% acima do período anterior",
    destino: "/admin/customers",
    icon: Users,
  },
  {
    titulo: "Logística",
    descricao: "96% das entregas no prazo",
    detalhe: "2 envios requerem atenção",
    destino: "/admin/logistica/visao-geral",
    icon: Truck,
  },
] as const;

export default async function Page() {
  let quantidadeProblemasLogisticos: number | null = null;
  try {
    const auditoria = await auditarLogisticaProdutos();
    quantidadeProblemasLogisticos = auditoria.resumo.invalidos;
  } catch (error) {
    console.error("[admin:dashboard:auditoria-logistica:erro]", {
      tipo:
        error instanceof Error ? error.constructor.name : "ErroDesconhecido",
    });
  }

  const alertaLogistico = {
    titulo:
      quantidadeProblemasLogisticos === null
        ? "Não foi possível verificar a logística"
        : `${quantidadeProblemasLogisticos} produto${quantidadeProblemasLogisticos === 1 ? "" : "s"} com problema logístico`,
    descricao:
      quantidadeProblemasLogisticos === null
        ? "Tente novamente em alguns instantes."
        : "Produtos com dados necessários ao envio incompletos ou inválidos.",
    destino: "/admin/products?problemaLogistico=true",
    prioridade: quantidadeProblemasLogisticos === 0 ? "Tudo certo" : "Atenção",
    icon: quantidadeProblemasLogisticos === 0 ? CheckCircle2 : Truck,
    tom:
      quantidadeProblemasLogisticos === 0
        ? "sucesso"
        : quantidadeProblemasLogisticos === null
          ? "urgente"
          : "aviso",
  } as const;
  const alertas = [alertaLogistico, ...alertasEstaticos];
  const totalAlertasComOcorrencia =
    alertasEstaticos.length + (quantidadeProblemasLogisticos === 0 ? 0 : 1);

  return (
    <div className="space-y-6 pb-2 md:space-y-7">
      <header className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="bg-success size-2 rounded-full shadow-[0_0_0_4px_var(--success-light)]" />
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Operação atualizada agora
            </p>
          </div>
          <h2 className="text-foreground text-2xl font-semibold tracking-[-0.035em] md:text-[2rem]">
            Visão geral
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe o que importa e priorize as próximas ações da loja.
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-card hover:border-primary/25 w-fit rounded-xl shadow-none transition-[background-color,border-color,box-shadow] hover:shadow-sm"
        >
          Últimos 30 dias <ChevronDown className="size-4" />
        </Button>
      </header>

      <SectionCards />

      <section
        className="superficie-admin overflow-hidden"
        aria-labelledby="titulo-alertas"
      >
        <div className="border-border/60 flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="bg-warning-light text-warning-foreground ring-warning/10 flex size-9 items-center justify-center rounded-xl ring-1">
              <AlertTriangle className="size-4" />
            </span>
            <div>
              <h3 id="titulo-alertas" className="text-sm font-semibold">
                Central de alertas
              </h3>
              <p className="text-muted-foreground text-xs">
                {totalAlertasComOcorrencia} pontos pedem sua atenção
              </p>
            </div>
          </div>
          <span className="text-muted-foreground hidden text-xs sm:block">
            Ordenados por prioridade
          </span>
        </div>
        <div className="bg-muted/18 grid gap-2 p-2 sm:p-2.5 lg:grid-cols-3">
          {alertas.map((alerta) => {
            const Icon = alerta.icon;
            return (
              <Link
                key={alerta.titulo}
                href={alerta.destino}
                className="bg-card group hover:border-primary/20 hover:shadow-elevation focus-visible:ring-ring flex min-h-28 items-start gap-3.5 rounded-xl border border-transparent p-4 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:outline-none sm:p-4.5"
              >
                <span
                  className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${alerta.tom === "urgente" ? "bg-destructive/10 text-destructive" : alerta.tom === "sucesso" ? "bg-success-light text-success-dark" : "bg-warning-light text-warning-foreground"}`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {alerta.titulo}
                    </span>
                    <Badge
                      variant={
                        alerta.tom === "urgente"
                          ? "destructive"
                          : alerta.tom === "sucesso"
                            ? "success"
                            : "warning"
                      }
                    >
                      {alerta.prioridade}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground block text-xs leading-relaxed">
                    {alerta.descricao}
                  </span>
                </span>
                <ArrowRight className="text-muted-foreground/70 group-hover:text-primary mt-2 size-4 shrink-0 transition-[color,transform] group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      <GraficoDesempenhoNegocio />

      <section aria-labelledby="titulo-operacao">
        <div className="mb-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Área operacional
          </p>
          <h3 id="titulo-operacao" className="mt-1 text-base font-semibold">
            O que precisa acontecer agora
          </h3>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <article className="superficie-admin hover:border-primary/15 hover:shadow-elevation overflow-hidden transition-[border-color,box-shadow] duration-200">
            <div className="border-border/60 flex items-center justify-between border-b px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="bg-primary-light text-primary ring-primary/10 flex size-9 items-center justify-center rounded-xl ring-1">
                  <ShoppingCart className="size-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold">Pedidos recentes</h4>
                  <p className="text-muted-foreground text-xs">
                    Últimas movimentações da loja
                  </p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/orders">
                  Ver todos <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
            <div className="divide-border/60 divide-y">
              {pedidosRecentes.map((pedido) => (
                <div
                  key={pedido.codigo}
                  className="hover:bg-primary/[0.025] grid min-h-[4.25rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors sm:px-5"
                >
                  <span className="text-primary text-xs font-semibold tabular-nums">
                    {pedido.codigo}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {pedido.cliente}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {pedido.valor}
                    </p>
                  </div>
                  <Badge
                    variant={
                      pedido.estado === "Enviado"
                        ? "info"
                        : pedido.estado === "Pago"
                          ? "success"
                          : "warning"
                    }
                  >
                    {pedido.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </article>

          <article className="superficie-admin hover:border-primary/15 hover:shadow-elevation overflow-hidden transition-[border-color,box-shadow] duration-200">
            <div className="border-border/60 flex items-center justify-between border-b px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="bg-warning-light text-warning-foreground ring-warning/10 flex size-9 items-center justify-center rounded-xl ring-1">
                  <Package className="size-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold">Produtos críticos</h4>
                  <p className="text-muted-foreground text-xs">
                    Estoque abaixo do recomendado
                  </p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/products">
                  Ver todos <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
            <div className="divide-border/60 divide-y">
              {produtosCriticos.map((produto) => (
                <div
                  key={produto.sku}
                  className="hover:bg-warning/[0.025] flex min-h-[4.25rem] items-center gap-3 px-4 py-3 transition-colors sm:px-5"
                >
                  <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Package className="text-muted-foreground size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {produto.nome}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      SKU {produto.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-destructive text-sm font-semibold tabular-nums">
                      {produto.quantidade} un.
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      disponíveis
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="painel-atendente-ia relative overflow-hidden rounded-2xl p-5 text-white sm:p-7 lg:p-8">
        <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)] lg:gap-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 shadow-[inset_0_1px_0_oklch(1_0_0/12%)] ring-1 ring-white/15 backdrop-blur">
                <Bot className="size-5" />
              </span>
              <div>
                <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                  <Sparkles className="size-3" /> Atendente IA
                </Badge>
                <p className="mt-1.5 text-xs text-white/55">
                  Inteligência da operação
                </p>
              </div>
            </div>
            <h3 className="mt-7 max-w-2xl text-2xl font-semibold tracking-[-0.03em] sm:text-[1.75rem]">
              Sua loja tem 3 oportunidades de melhoria hoje.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
              O assistente identificou dúvidas recorrentes sobre entrega e uma
              oportunidade de recuperar conversões.
            </p>
            <Button
              asChild
              className="mt-7 bg-white text-slate-900 shadow-lg shadow-black/10 transition-[transform,background-color,box-shadow] hover:-translate-y-px hover:bg-white/90 hover:shadow-xl"
            >
              <Link href="/admin/atendente-ia/treinamento">
                Abrir painel da IA <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.075] p-4 shadow-[inset_0_1px_0_oklch(1_0_0/8%)] ring-1 ring-white/10 backdrop-blur-sm sm:p-5">
              <CheckCircle2 className="mb-4 size-4 text-emerald-300" />
              <p className="text-2xl font-semibold tabular-nums">87%</p>
              <p className="mt-1 text-xs text-white/55">resolvidas pela IA</p>
            </div>
            <div className="rounded-2xl bg-white/[0.075] p-4 shadow-[inset_0_1px_0_oklch(1_0_0/8%)] ring-1 ring-white/10 backdrop-blur-sm sm:p-5">
              <Clock3 className="mb-4 size-4 text-blue-300" />
              <p className="text-2xl font-semibold tabular-nums">142</p>
              <p className="mt-1 text-xs text-white/55">conversas hoje</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="titulo-modulos">
        <div className="mb-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Resumo dos módulos
          </p>
          <h3 id="titulo-modulos" className="mt-1 text-base font-semibold">
            Saúde da operação
          </h3>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {modulos.map((modulo) => {
            const Icon = modulo.icon;
            return (
              <article
                key={modulo.titulo}
                className="superficie-admin group hover:border-primary/25 hover:shadow-elevation flex min-h-44 flex-col p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <span className="bg-primary-light text-primary ring-primary/10 flex size-10 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105">
                    <Icon className="size-4" />
                  </span>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary -mt-1 -mr-1 size-8 rounded-lg"
                  >
                    <Link
                      href={modulo.destino}
                      aria-label={`Ver detalhes de ${modulo.titulo}`}
                    >
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
                <div className="mt-auto pt-5">
                  <h4 className="text-sm font-semibold">{modulo.titulo}</h4>
                  <p className="mt-2 text-base font-semibold tracking-tight">
                    {modulo.descricao}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {modulo.detalhe}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
