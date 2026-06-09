import { eq } from "drizzle-orm";

import {
  cuponsPromocaoTable,
  usosCuponsPromocaoTable,
} from "../../../db/schema";
import { calcularDescontoProduto } from "../lib/calcular-desconto-produto";
import type { TipoDescontoPromocao } from "../types";

type UsoCupomPromocaoBanco = typeof usosCuponsPromocaoTable.$inferSelect;
type CupomPromocaoBanco = typeof cuponsPromocaoTable.$inferSelect & {
  usos?: UsoCupomPromocaoBanco[];
};

export type MotivoCupomInvalido =
  | "codigo_invalido"
  | "cupom_inexistente"
  | "cupom_inativo"
  | "cupom_agendado"
  | "cupom_expirado"
  | "subtotal_insuficiente"
  | "limite_total_atingido"
  | "limite_cliente_atingido";

export type EntradaValidarCupomPromocao = {
  codigoCupom: string;
  subtotalEmCentavos: number;
  clienteId?: string | null;
  dataReferencia?: Date;
  clienteBanco?: ClienteBancoValidacaoCupom;
};

export type ResultadoValidarCupomPromocao = {
  valido: boolean;
  codigo: string;
  mensagem: string;
  tipoDesconto: TipoDescontoPromocao | null;
  valorDesconto: number;
  descontoEstimadoEmCentavos: number;
  motivoInvalido?: MotivoCupomInvalido;
};

export type ClienteBancoValidacaoCupom = {
  query: {
    cuponsPromocaoTable: {
      findFirst: (entrada: unknown) => Promise<CupomPromocaoBanco | undefined>;
    };
  };
};

function normalizarCodigoCupom(codigoCupom: string) {
  return codigoCupom.trim().toUpperCase();
}

async function obterClienteBancoValidacaoCupom(
  clienteBanco?: ClienteBancoValidacaoCupom,
): Promise<ClienteBancoValidacaoCupom> {
  if (clienteBanco) {
    return clienteBanco;
  }

  const { db } = await import("../../../db/connection");
  return db as unknown as ClienteBancoValidacaoCupom;
}

function criarResultadoInvalido({
  codigo,
  mensagem,
  motivoInvalido,
}: {
  codigo: string;
  mensagem: string;
  motivoInvalido: MotivoCupomInvalido;
}): ResultadoValidarCupomPromocao {
  return {
    valido: false,
    codigo,
    mensagem,
    tipoDesconto: null,
    valorDesconto: 0,
    descontoEstimadoEmCentavos: 0,
    motivoInvalido,
  };
}

function contarUsosCliente(
  cupom: CupomPromocaoBanco,
  clienteId?: string | null,
) {
  if (!clienteId) {
    return 0;
  }

  return (cupom.usos ?? []).filter((uso) => uso.clienteId === clienteId).length;
}

export async function validarCupomPromocao(
  entrada: EntradaValidarCupomPromocao,
): Promise<ResultadoValidarCupomPromocao> {
  const codigo = normalizarCodigoCupom(entrada.codigoCupom);
  const dataReferencia = entrada.dataReferencia ?? new Date();

  if (!codigo) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Informe um código de cupom válido.",
      motivoInvalido: "codigo_invalido",
    });
  }

  const clienteBanco = await obterClienteBancoValidacaoCupom(
    entrada.clienteBanco,
  );
  const cupom = await clienteBanco.query.cuponsPromocaoTable.findFirst({
    where: eq(cuponsPromocaoTable.codigo, codigo),
    with: {
      usos: entrada.clienteId
        ? {
            where: eq(usosCuponsPromocaoTable.clienteId, entrada.clienteId),
          }
        : true,
    },
  });

  if (!cupom) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Cupom não encontrado.",
      motivoInvalido: "cupom_inexistente",
    });
  }

  if (!cupom.ativo) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Cupom inativo.",
      motivoInvalido: "cupom_inativo",
    });
  }

  if (cupom.dataInicio > dataReferencia) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Cupom ainda não está válido.",
      motivoInvalido: "cupom_agendado",
    });
  }

  if (cupom.dataFim && cupom.dataFim < dataReferencia) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Cupom expirado.",
      motivoInvalido: "cupom_expirado",
    });
  }

  if (entrada.subtotalEmCentavos < cupom.subtotalMinimo) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Subtotal mínimo do cupom não foi atingido.",
      motivoInvalido: "subtotal_insuficiente",
    });
  }

  if (
    cupom.limiteUsoTotal !== null &&
    cupom.totalUsos >= cupom.limiteUsoTotal
  ) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Limite total de uso do cupom atingido.",
      motivoInvalido: "limite_total_atingido",
    });
  }

  const usosCliente = contarUsosCliente(cupom, entrada.clienteId);

  if (
    cupom.limiteUsoPorCliente !== null &&
    entrada.clienteId &&
    usosCliente >= cupom.limiteUsoPorCliente
  ) {
    return criarResultadoInvalido({
      codigo,
      mensagem: "Limite de uso por cliente atingido.",
      motivoInvalido: "limite_cliente_atingido",
    });
  }

  const descontoEstimadoEmCentavos = calcularDescontoProduto({
    precoBaseEmCentavos: entrada.subtotalEmCentavos,
    tipoDesconto: cupom.tipoDesconto,
    valorDesconto: cupom.valorDesconto,
  });

  return {
    valido: true,
    codigo,
    mensagem: "Cupom válido.",
    tipoDesconto: cupom.tipoDesconto,
    valorDesconto: cupom.valorDesconto,
    descontoEstimadoEmCentavos,
  };
}
