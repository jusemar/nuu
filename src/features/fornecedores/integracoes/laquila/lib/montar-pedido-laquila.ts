import { createHash } from "node:crypto";

export type ItemPedidoLaquila = {
  cd_item: string;
  qt_pedida: number;
  vl_unitario: number;
};

export type PedidoLaquilaSemCredenciais = {
  cpf_cnpj: string;
  cpf_cnpj_consulta: string;
  nm_cliente: string;
  email: string;
  nr_celular: string;
  cd_transportador: string;
  itens: ItemPedidoLaquila[];
};

export type EntradaItemPedidoLaquila = {
  codigoFornecedor: string;
  quantidade: number;
  precoUnitarioEmCentavos: number;
};

/**
 * Regra comercial provisória: usa preço unitário do item após promoção e antes
 * de cupom global; confirmar com a Laquila.
 */
export function obterValorUnitarioPedidoLaquila(
  precoUnitarioPersistidoEmCentavos: number,
) {
  if (
    !Number.isInteger(precoUnitarioPersistidoEmCentavos) ||
    precoUnitarioPersistidoEmCentavos < 0
  ) {
    throw new TypeError("Preço unitário persistido inválido para a Laquila.");
  }

  return precoUnitarioPersistidoEmCentavos / 100;
}

function normalizarDocumento(valor: string) {
  const documento = valor.replace(/\D/gu, "");
  if (documento.length !== 11 && documento.length !== 14) {
    throw new TypeError("CPF/CNPJ do pedido inválido para a Laquila.");
  }
  return documento;
}

function normalizarTelefone(valor: string) {
  const telefone = valor.replace(/\D/gu, "");
  if (telefone.length < 10 || telefone.length > 13) {
    throw new TypeError("Celular do pedido inválido para a Laquila.");
  }
  return telefone;
}

export function montarItensPedidoLaquila(
  itens: readonly EntradaItemPedidoLaquila[],
): ItemPedidoLaquila[] {
  if (itens.length === 0) throw new TypeError("Grupo Laquila sem itens.");

  return itens.map((item) => {
    const codigo = item.codigoFornecedor.trim();
    if (!codigo)
      throw new TypeError("Produto Laquila sem código do fornecedor.");
    if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      throw new TypeError("Quantidade inválida para a Laquila.");
    }

    return {
      cd_item: codigo,
      qt_pedida: item.quantidade,
      vl_unitario: obterValorUnitarioPedidoLaquila(
        item.precoUnitarioEmCentavos,
      ),
    };
  });
}

export function montarPedidoLaquilaSemCredenciais(entrada: {
  documento: string;
  cnpjLojista: string;
  nome: string;
  email: string;
  telefone: string;
  cdTransportador: string;
  itens: readonly EntradaItemPedidoLaquila[];
}): PedidoLaquilaSemCredenciais {
  const documento = normalizarDocumento(entrada.documento);
  const cnpjLojista = normalizarDocumento(entrada.cnpjLojista);

  if (cnpjLojista.length !== 14) {
    throw new TypeError("CNPJ do lojista inválido para a Laquila.");
  }

  return {
    cpf_cnpj: documento,
    cpf_cnpj_consulta: cnpjLojista,
    nm_cliente: entrada.nome.trim(),
    email: entrada.email.trim().toLowerCase(),
    nr_celular: normalizarTelefone(entrada.telefone),
    cd_transportador: entrada.cdTransportador.trim(),
    itens: montarItensPedidoLaquila(entrada.itens),
  };
}

/** Versão mínima persistível: deliberadamente exclui PII e credenciais. */
export function sanitizarPedidoLaquila(pedido: PedidoLaquilaSemCredenciais) {
  return {
    cd_transportador: pedido.cd_transportador,
    itens: pedido.itens,
  };
}

function ordenarParaSerializacao(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenarParaSerializacao);
  if (!valor || typeof valor !== "object") return valor;

  return Object.fromEntries(
    Object.entries(valor as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chave, item]) => [chave, ordenarParaSerializacao(item)]),
  );
}

export function gerarHashPayloadPedidoLaquila(
  pedido: PedidoLaquilaSemCredenciais,
) {
  return createHash("sha256")
    .update(JSON.stringify(ordenarParaSerializacao(pedido)))
    .digest("hex");
}

export function criarChaveIdempotenciaPedidoLaquila(
  pedidoId: string,
  chaveGrupo: string,
) {
  return `pedido:${pedidoId}:provedor:laquila:grupo:${chaveGrupo}`;
}
