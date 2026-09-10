import "server-only";

import { dbTransacional } from "@/db/transaction";

import { aplicarPermissoesConviteWhatsappNaTransacao } from "./aplicar-permissoes-convite-whatsapp";
import { consumirConviteWhatsappNaTransacao } from "./consumir-convite-whatsapp";
import { criarOuReutilizarVinculoConviteWhatsappNaTransacao } from "./criar-vinculo-convite-whatsapp";
import { validarAceiteConviteWhatsappNaTransacao } from "./validar-aceite-convite-whatsapp";

export type EntradaAceiteConviteWhatsapp = {
  contextoHash: string;
  token: string;
  usuarioSessaoId: string | null;
};

/**
 * Compõe as etapas 5A, 5B, 5C1 e 5C2A no mesmo contexto transacional.
 * Falhas após a criação do vínculo lançam erro para reverter também o RBAC e
 * impedir que convite ou prova sejam consumidos parcialmente.
 */
export async function aceitarConviteWhatsapp(
  entrada: EntradaAceiteConviteWhatsapp,
) {
  try {
    return await dbTransacional.transaction(async (tx) => {
      const validacao = await validarAceiteConviteWhatsappNaTransacao(tx, entrada);
      if (!validacao) return null;

      const vinculo = await criarOuReutilizarVinculoConviteWhatsappNaTransacao(
        tx,
        validacao,
      );
      if (!vinculo) throw new Error("VINCULO_ADMIN_INCOMPATIVEL");

      const permissoes = await aplicarPermissoesConviteWhatsappNaTransacao(tx, {
        administradorId: vinculo.administradorId,
        validacao,
      });
      if (!permissoes) throw new Error("RBAC_NAO_APLICADO");

      const consumo = await consumirConviteWhatsappNaTransacao(tx, {
        administradorId: vinculo.administradorId,
        contextoHash: entrada.contextoHash,
        validacao,
      });
      if (!consumo) throw new Error("CONVITE_NAO_CONSUMIDO");

      return {
        aceito: true as const,
        acessoAdmin: true as const,
        proximoDestino: "/admin" as const,
      };
    });
  } catch {
    return null;
  }
}
