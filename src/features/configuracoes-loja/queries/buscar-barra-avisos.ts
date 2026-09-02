import "server-only";

import { asc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";
import {
  configuracoesBarraAvisosTable,
  mensagensBarraAvisosTable,
} from "@/db/schema";

import type { ConfiguracaoBarraAvisos } from "../types/barra-avisos.types";

const ID_CONFIGURACAO_GLOBAL = "global";

const CONFIGURACAO_SEGURA: ConfiguracaoBarraAvisos = {
  ativo: false,
  corFundo: "#0c447c",
  corTexto: "#ffffff",
  velocidadeSegundos: 60,
  pausarHover: true,
  mensagens: [],
};

export const buscarBarraAvisos = cache(async () => {
  try {
    const [configuracao] = await db
      .select()
      .from(configuracoesBarraAvisosTable)
      .where(eq(configuracoesBarraAvisosTable.id, ID_CONFIGURACAO_GLOBAL))
      .limit(1);

    if (!configuracao) return CONFIGURACAO_SEGURA;

    const mensagens = await db
      .select()
      .from(mensagensBarraAvisosTable)
      .where(
        eq(mensagensBarraAvisosTable.configuracaoId, ID_CONFIGURACAO_GLOBAL),
      )
      .orderBy(asc(mensagensBarraAvisosTable.ordem));

    return {
      ativo: configuracao.ativo,
      corFundo: configuracao.corFundo,
      corTexto: configuracao.corTexto,
      velocidadeSegundos: configuracao.velocidadeSegundos,
      pausarHover: configuracao.pausarHover,
      mensagens: mensagens.map((mensagem) => ({
        id: mensagem.id,
        texto: mensagem.texto,
        icone: mensagem.icone,
        ativo: mensagem.ativo,
        ordem: mensagem.ordem,
      })),
    } satisfies ConfiguracaoBarraAvisos;
  } catch (error) {
    // Rollout seguro: antes da migration ou diante de indisponibilidade, a barra
    // some sem impedir que a página pública ou o admin sejam renderizados.
    console.error("[barra-avisos:falha-leitura]", {
      tipo: error instanceof Error ? error.name : "Erro desconhecido",
    });
    return CONFIGURACAO_SEGURA;
  }
});
