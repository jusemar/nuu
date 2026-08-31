import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";
import { configuracoesLojaTable } from "@/db/schema";

const ID_CONFIGURACAO_GLOBAL = "global";

function ehColunaLogoAindaNaoMigrada(error: unknown) {
  if (!error || typeof error !== "object" || !("cause" in error)) return false;
  const causa = error.cause;
  return (
    !!causa &&
    typeof causa === "object" &&
    "code" in causa &&
    causa.code === "42703"
  );
}

export const buscarConfiguracaoLoja = cache(
  async function buscarConfiguracaoLoja() {
    try {
      const [configuracao] = await db
        .select({
          nomeComercial: configuracoesLojaTable.nomeComercial,
          logoCabecalhoUrl: configuracoesLojaTable.logoCabecalhoUrl,
          logoRodapeUrl: configuracoesLojaTable.logoRodapeUrl,
        })
        .from(configuracoesLojaTable)
        .where(eq(configuracoesLojaTable.id, ID_CONFIGURACAO_GLOBAL))
        .limit(1);

      return {
        nomeComercial: configuracao?.nomeComercial?.trim() || null,
        logoCabecalhoUrl: configuracao?.logoCabecalhoUrl?.trim() || null,
        logoRodapeUrl: configuracao?.logoRodapeUrl?.trim() || null,
      };
    } catch (error) {
      if (!ehColunaLogoAindaNaoMigrada(error)) throw error;

      // Compatibilidade temporária de rollout: o site não quebra se o código
      // chegar antes da migration; apenas mantém a identidade textual segura.
      const [configuracaoLegada] = await db
        .select({ nomeComercial: configuracoesLojaTable.nomeComercial })
        .from(configuracoesLojaTable)
        .where(eq(configuracoesLojaTable.id, ID_CONFIGURACAO_GLOBAL))
        .limit(1);

      return {
        nomeComercial: configuracaoLegada?.nomeComercial?.trim() || null,
        logoCabecalhoUrl: null,
        logoRodapeUrl: null,
      };
    }
  },
);
