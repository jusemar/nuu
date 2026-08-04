import { createHash } from "node:crypto";

import {
  type FerramentaLaboratorio,
  ferramentaLaboratorioPermitida,
} from "./registro-ferramentas-laboratorio";
const PROIBIDAS =
  /(criar|alterar|cancelar|confirmar|enviar|whatsapp|pagamento|update|delete|write)/i;
export function simularFerramenta(
  nome: string,
  entrada: Record<string, unknown>,
) {
  if (!ferramentaLaboratorioPermitida(nome) || PROIBIDAS.test(nome))
    throw new Error("FERRAMENTA_INDISPONIVEL_NO_LABORATORIO");
  const referencia = createHash("sha256")
    .update(JSON.stringify([nome, entrada]))
    .digest("hex")
    .slice(0, 12);
  const respostas: Record<FerramentaLaboratorio, Record<string, unknown>> = {
    buscar_produto_ficticio: {
      encontrado: true,
      produto: "PRODUTO_FICTICIO",
      referencia,
    },
    consultar_preco_ficticio: { moeda: "BRL", preco: 123.45, referencia },
    consultar_estoque_ficticio: {
      disponivel: true,
      quantidadeFicticia: 7,
      referencia,
    },
    consultar_promocao_ficticia: { ativa: false, referencia },
    consultar_logistica_ficticia: { prazoDiasFicticio: 4, referencia },
    consultar_pedido_anonimizado: {
      estado: "EM_SEPARACAO_FICTICIO",
      referencia,
    },
    simular_transferencia: { transferida: false, simulacao: true, referencia },
  };
  return Object.freeze(respostas[nome]);
}
