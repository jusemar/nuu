import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  PAGAMENTO_GATEWAY_LABEL,
  PAGAMENTO_METODO_LABEL,
} from "../../../constants/admin-pedidos";
import {
  formatarCepAdminPedido,
  formatarDataAdminPedido,
  formatarDocumentoAdminPedido,
  formatarMoedaAdminPedido,
  resumirProviderResponseAdminPedido,
  serializarProviderResponseAdminPedido,
} from "../../../lib/admin-pedidos/formatar-admin-pedidos";
import { buscarPedidoAdminPorId } from "../../../queries/pedidos-admin/buscar-pedido-admin";
import type { PedidoAdminDetalhe } from "../../../types/admin-pedidos.types";
import { FormularioAlterarStatusPedido } from "./formulario-alterar-status-pedido";
import { FormularioLogisticaPedido } from "./formulario-logistica-pedido";
import { PagamentoStatusBadge, PedidoStatusBadge } from "./status-pedido-badge";
import { TimelineHistoricoPedido } from "./timeline-historico-pedido";

function CampoDetalhe({
  label,
  valor,
}: {
  label: string;
  valor: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words text-slate-900">
        {valor || "-"}
      </dd>
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">{titulo}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ResumoFinanceiro({ pedido }: { pedido: PedidoAdminDetalhe }) {
  return (
    <dl className="space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <dt className="text-slate-600">Subtotal</dt>
        <dd className="font-medium text-slate-900">
          {formatarMoedaAdminPedido(pedido.subtotalEmCentavos)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <dt className="text-slate-600">Frete</dt>
        <dd className="font-medium text-slate-900">
          {formatarMoedaAdminPedido(pedido.freteEmCentavos)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <dt className="text-slate-600">Desconto</dt>
        <dd className="font-medium text-slate-900">
          -{formatarMoedaAdminPedido(pedido.descontoEmCentavos)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4 border-t pt-3">
        <dt className="font-semibold text-slate-950">Total</dt>
        <dd className="text-lg font-semibold text-slate-950">
          {formatarMoedaAdminPedido(pedido.totalEmCentavos)}
        </dd>
      </div>
    </dl>
  );
}

function ItensPedido({ pedido }: { pedido: PedidoAdminDetalhe }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead>Produto</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Modalidade</TableHead>
          <TableHead className="text-right">Qtd.</TableHead>
          <TableHead className="text-right">Unitario</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedido.itens.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium text-slate-900">
              <div>{item.nomeProduto}</div>
              {Object.keys(item.atributosVariante).length > 0 ? (
                <div className="mt-1 text-xs font-normal text-slate-500">
                  {Object.entries(item.atributosVariante)
                    .map(([nome, valor]) => `${nome}: ${valor}`)
                    .join(" • ")}
                </div>
              ) : null}
            </TableCell>
            <TableCell>{item.skuProduto || "-"}</TableCell>
            <TableCell>
              {item.modalidade &&
              Object.keys(item.atributosVariante).length === 0 ? (
                <div>
                  <div>{item.modalidade}</div>
                  <div className="text-xs text-slate-500">
                    {item.prazoModalidade}
                  </div>
                </div>
              ) : item.prazoModalidade ? (
                <span className="text-xs text-slate-500">
                  {item.prazoModalidade}
                </span>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="text-right">{item.quantidade}</TableCell>
            <TableCell className="text-right">
              {formatarMoedaAdminPedido(item.precoUnitarioEmCentavos)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatarMoedaAdminPedido(item.totalEmCentavos)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export async function PedidoDetalheAdminPage({ id }: { id: string }) {
  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const pedido = await buscarPedidoAdminPorId(id);

  if (!pedido) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-3 -ml-3">
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Pedido {pedido.numeroPedido}
            </h1>
            <div className="flex flex-wrap gap-2">
              <div className="space-y-1">
                <span className="block text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  Pedido
                </span>
                <PedidoStatusBadge status={pedido.status} />
              </div>
              <div className="space-y-1">
                <span className="block text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  Pagamento
                </span>
                <PagamentoStatusBadge status={pedido.pagamentoStatus} />
              </div>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Criado em {formatarDataAdminPedido(pedido.createdAt)} e atualizado
            em {formatarDataAdminPedido(pedido.updatedAt)}.
          </p>
        </div>
        <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {PAGAMENTO_GATEWAY_LABEL[pedido.gateway]}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Secao titulo="Cliente">
            <dl className="grid gap-4 md:grid-cols-2">
              <CampoDetalhe label="Nome" valor={pedido.cliente.nome} />
              <CampoDetalhe label="Email" valor={pedido.cliente.email} />
              <CampoDetalhe label="Telefone" valor={pedido.cliente.telefone} />
              <CampoDetalhe
                label="Documento"
                valor={formatarDocumentoAdminPedido(pedido.cliente.documento)}
              />
            </dl>
          </Secao>

          <Secao titulo="Endereco">
            <dl className="grid gap-4 md:grid-cols-2">
              <CampoDetalhe
                label="CEP"
                valor={formatarCepAdminPedido(pedido.endereco.cep)}
              />
              <CampoDetalhe
                label="Rua"
                valor={`${pedido.endereco.rua}, ${pedido.endereco.numero}`}
              />
              <CampoDetalhe
                label="Complemento"
                valor={pedido.endereco.complemento}
              />
              <CampoDetalhe label="Bairro" valor={pedido.endereco.bairro} />
              <CampoDetalhe
                label="Cidade/UF"
                valor={`${pedido.endereco.cidade} / ${pedido.endereco.estado}`}
              />
              <CampoDetalhe
                label="Observacao"
                valor={pedido.endereco.observacao}
              />
            </dl>
          </Secao>

          <Secao titulo="Itens do pedido">
            <ItensPedido pedido={pedido} />
          </Secao>
        </div>

        <div className="space-y-5">
          <Secao titulo="Operacao">
            <FormularioAlterarStatusPedido
              pedidoId={pedido.id}
              statusAtual={pedido.status}
            />
          </Secao>

          <Secao titulo="Logística">
            <FormularioLogisticaPedido
              pedidoId={pedido.id}
              logistica={pedido.logistica}
            />
          </Secao>

          <Secao titulo="Resumo financeiro">
            <ResumoFinanceiro pedido={pedido} />
          </Secao>

          <Secao titulo="Pagamento">
            {pedido.pagamento ? (
              <dl className="space-y-4">
                <CampoDetalhe
                  label="Gateway"
                  valor={PAGAMENTO_GATEWAY_LABEL[pedido.pagamento.gateway]}
                />
                <CampoDetalhe
                  label="Metodo"
                  valor={PAGAMENTO_METODO_LABEL[pedido.pagamento.metodo]}
                />
                <div>
                  <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <PagamentoStatusBadge status={pedido.pagamento.status} />
                  </dd>
                </div>
                <CampoDetalhe
                  label="Valor"
                  valor={formatarMoedaAdminPedido(
                    pedido.pagamento.valorEmCentavos,
                  )}
                />
                <CampoDetalhe
                  label="Transaction/session ID"
                  valor={pedido.pagamento.transactionId}
                />
                <CampoDetalhe
                  label="PIX txid"
                  valor={pedido.pagamento.pixTxid}
                />
                <CampoDetalhe
                  label="Expira em"
                  valor={
                    pedido.pagamento.expiresAt
                      ? formatarDataAdminPedido(pedido.pagamento.expiresAt)
                      : null
                  }
                />
                <CampoDetalhe
                  label="Pago em"
                  valor={
                    pedido.pagamento.paidAt
                      ? formatarDataAdminPedido(pedido.pagamento.paidAt)
                      : null
                  }
                />
              </dl>
            ) : (
              <p className="text-sm text-slate-600">
                Nenhum pagamento associado ao pedido.
              </p>
            )}
          </Secao>
        </div>
      </div>

      <Secao titulo="Historico do pedido">
        <TimelineHistoricoPedido historicos={pedido.historicos} />
      </Secao>

      <Secao titulo="Provider response">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {resumirProviderResponseAdminPedido(
              pedido.pagamento?.providerResponse,
            )}
          </Badge>
        </div>
        <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
          {serializarProviderResponseAdminPedido(
            pedido.pagamento?.providerResponse,
          )}
        </pre>
      </Secao>
    </div>
  );
}
