import "server-only";

import { timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { checkoutPedidoItensTable, checkoutPedidosTable } from "@/db/schema";

import { processarPedidoLaquila00002 } from "../actions/processar-pedido-laquila-00002";
import { prepararPedidoLaquila } from "../queries/preparar-pedido-laquila";
import {
  consultarPedidoLaquila,
  criarClienteLaquila,
  type RespostaLaquilaJson,
} from "./cliente-laquila";

const AMBIENTE_ESPERADO = "producao";
const HOST_BANCO_ESPERADO =
  "ep-proud-bonus-acy2bafx-pooler.sa-east-1.aws.neon.tech";
const HOST_LAQUILA_ESPERADO = "api-dropshipping.laquila.com.br";
const CNPJ_LOJISTA_ESPERADO = "48732308000158";
const PRODUTO_ID_ESPERADO = "1ee98f65-a649-4018-baf6-3e52bd5d031a";
const SKU_ESPERADO = "MOT-COND-863";
const CODIGO_LAQUILA_ESPERADO = "1104095";
const TRANSPORTADOR_LAQUILA_ESPERADO = "63993";

function compararSegredo(primeiro: string, segundo: string) {
  const primeiroBuffer = Buffer.from(primeiro);
  const segundoBuffer = Buffer.from(segundo);

  return (
    primeiroBuffer.length === segundoBuffer.length &&
    timingSafeEqual(primeiroBuffer, segundoBuffer)
  );
}

export function validarTokenTesteLaquilaTemporario(request: Request) {
  const esperado = process.env.TESTE_LAQUILA_TEMPORARIO_TOKEN?.trim();
  const recebido = request.headers.get("x-teste-laquila-token")?.trim();

  return Boolean(esperado && recebido && compararSegredo(esperado, recebido));
}

function validarRuntimeProducao() {
  if (
    process.env.APP_ENVIRONMENT !== AMBIENTE_ESPERADO ||
    process.env.VERCEL_ENV !== "production"
  ) {
    throw new Error("A rota temporária só pode executar na Vercel Production.");
  }

  const urlBanco = process.env.DATABASE_URL?.trim();
  if (!urlBanco || new URL(urlBanco).hostname !== HOST_BANCO_ESPERADO) {
    throw new Error("O banco carregado não é o banco de produção aprovado.");
  }

  const cnpjLojista = process.env.LAQUILA_CNPJ_LOJISTA?.replace(/\D/gu, "");
  if (cnpjLojista !== CNPJ_LOJISTA_ESPERADO) {
    throw new Error("O CNPJ lojista de produção não corresponde ao aprovado.");
  }
}

async function validarPedidoInterno(pedidoId: string) {
  const [pedido] = await db
    .select({ numero: checkoutPedidosTable.numeroPedido })
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.id, pedidoId))
    .limit(1);

  if (!pedido || pedido.numero === "#1034" || pedido.numero === "#1035") {
    throw new Error("Informe um pedido novo, diferente dos testes históricos.");
  }

  const itens = await db
    .select({
      produtoId: checkoutPedidoItensTable.produtoId,
      sku: checkoutPedidoItensTable.skuProduto,
      quantidade: checkoutPedidoItensTable.quantidade,
    })
    .from(checkoutPedidoItensTable)
    .where(eq(checkoutPedidoItensTable.pedidoId, pedidoId));

  if (
    itens.length !== 1 ||
    itens[0]?.produtoId !== PRODUTO_ID_ESPERADO ||
    itens[0]?.sku !== SKU_ESPERADO ||
    itens[0]?.quantidade !== 1
  ) {
    throw new Error("O pedido não contém exclusivamente o produto aprovado.");
  }

  return pedido.numero;
}

function respostaContemIdPedido(
  resposta: RespostaLaquilaJson,
  idPedido: string,
) {
  const pendentes: unknown[] = [resposta];

  while (pendentes.length > 0) {
    const atual = pendentes.shift();
    if (!atual || typeof atual !== "object") continue;

    for (const [chave, valor] of Object.entries(
      atual as Record<string, unknown>,
    )) {
      if (chave.toLowerCase() === "id_pedido" && String(valor) === idPedido) {
        return true;
      }
      if (valor && typeof valor === "object") pendentes.push(valor);
    }
  }

  return false;
}

/**
 * Orquestra somente um pedido previamente criado e pago pelo checkout normal.
 * Nenhum dado pessoal é aceito pela rota; toda a origem permanece no snapshot.
 */
export async function executarTesteLaquilaTemporario(pedidoId: string) {
  validarRuntimeProducao();
  const numeroPedido = await validarPedidoInterno(pedidoId);
  const grupos = await prepararPedidoLaquila(pedidoId, "producao");

  if (
    grupos.length !== 1 ||
    grupos[0]?.pedidoSemCredenciais.itens.length !== 1
  ) {
    throw new Error("O pedido deve possuir exatamente um grupo Laquila.");
  }

  const grupo = grupos[0];
  const item = grupo.pedidoSemCredenciais.itens[0];
  const hostLaquila = new URL(grupo.credenciais.configuracao.urlBase ?? "")
    .hostname;

  if (
    hostLaquila !== HOST_LAQUILA_ESPERADO ||
    grupo.pedidoSemCredenciais.cpf_cnpj_consulta !== CNPJ_LOJISTA_ESPERADO ||
    grupo.pedidoSemCredenciais.cd_transportador !==
      TRANSPORTADOR_LAQUILA_ESPERADO ||
    item?.cd_item !== CODIGO_LAQUILA_ESPERADO ||
    item.qt_pedida !== 1 ||
    !Number.isFinite(item.vl_unitario) ||
    item.vl_unitario <= 0
  ) {
    throw new Error("O payload preparado diverge do teste aprovado.");
  }

  // Esta chamada reutiliza a aquisição atômica, revalida o 00006 e permite
  // no máximo um 00002 sem retry automático.
  const [integracao] = await processarPedidoLaquila00002(pedidoId);
  if (!integracao) throw new Error("A integração Laquila não foi produzida.");

  const idPedidoExterno =
    typeof integracao.idPedidoExterno === "string"
      ? integracao.idPedidoExterno.trim()
      : "";

  if (integracao.status !== "criado" || !idPedidoExterno) {
    return {
      pedido: numeroPedido,
      integracao: {
        status: integracao.status,
        tentativas: integracao.tentativas,
      },
      consulta00008: "nao_executada",
    };
  }

  const cliente = criarClienteLaquila({
    id: grupo.credenciais.configuracao.id,
    ambiente: grupo.ambiente,
    urlBase: grupo.credenciais.configuracao.urlBase,
    cnpjEmpresa: grupo.credenciais.configuracao.cnpjEmpresa,
    tokenClienteCriptografado: null,
  });
  const consulta = await consultarPedidoLaquila({
    cliente,
    tokenCliente: grupo.credenciais.tokenCliente,
    idPedido: idPedidoExterno,
  });

  return {
    pedido: numeroPedido,
    integracao: {
      status: integracao.status,
      tentativas: integracao.tentativas,
      idPedidoExterno,
    },
    consulta00008: consulta.sucesso
      ? {
          codigoHttp: consulta.codigoHttp,
          pedidoEncontrado: respostaContemIdPedido(
            consulta.dados,
            idPedidoExterno,
          ),
        }
      : {
          codigoHttp: consulta.codigoHttp,
          erro: consulta.erro,
        },
  };
}
