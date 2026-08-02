import { createHash } from "node:crypto";

import type {
  DadosEntradaMensagem,
  IdentidadeEntradaAtendimento,
} from "../types/entrada-mensagem";

export function criarEscopoIdempotenciaEntrada(
  identidade: IdentidadeEntradaAtendimento,
) {
  const tipo = identidade.usuarioId ? "usuario" : "visitante";
  const identificador = identidade.usuarioId ?? identidade.identificadorSessao;

  return `entrada_mensagem_site:${tipo}:${identificador}`;
}

export function criarChavePersistidaMensagem(
  escopo: string,
  chaveIdempotencia: string,
) {
  return createHash("sha256")
    .update(`${escopo}:${chaveIdempotencia}`)
    .digest("hex");
}

export function criarHashEntradaMensagem(
  dados: DadosEntradaMensagem,
  identidade: IdentidadeEntradaAtendimento,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        canal: dados.canal,
        avisoPrivacidadeVersao: dados.avisoPrivacidadeVersao,
        chaveIdempotencia: dados.chaveIdempotencia,
        conversaId: dados.conversaId ?? null,
        mensagem: dados.mensagem,
        identificadorSessao: identidade.identificadorSessao,
        usuarioId: identidade.usuarioId,
      }),
    )
    .digest("hex");
}

export function conversaPertenceAIdentidade(
  conversa: {
    canal: "site";
    identificadorSessao: string;
    usuarioId: string | null;
  },
  identidade: IdentidadeEntradaAtendimento,
) {
  return (
    conversa.canal === "site" &&
    conversa.identificadorSessao === identidade.identificadorSessao &&
    conversa.usuarioId === identidade.usuarioId
  );
}
