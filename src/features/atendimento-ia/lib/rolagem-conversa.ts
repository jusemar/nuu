export const DISTANCIA_ACOMPANHAMENTO_CONVERSA_PX = 96;

type MedidasRolagem = {
  alturaConteudo: number;
  alturaVisivel: number;
  posicaoVertical: number;
};

/**
 * Mede apenas o espaço restante dentro da lista da conversa. Dessa forma, a
 * decisão de acompanhar mensagens novas não depende da rolagem da página.
 */
export function calcularDistanciaDoFim({
  alturaConteudo,
  alturaVisivel,
  posicaoVertical,
}: MedidasRolagem) {
  return Math.max(0, alturaConteudo - alturaVisivel - posicaoVertical);
}

export function estaProximoDoFim(
  medidas: MedidasRolagem,
  limiteEmPixels = DISTANCIA_ACOMPANHAMENTO_CONVERSA_PX,
) {
  return calcularDistanciaDoFim(medidas) <= limiteEmPixels;
}

export type EventoRolagemConversa =
  | "conteudo_atualizado"
  | "envio_cliente"
  | "historico_recuperado"
  | "ir_para_recentes"
  | "rolagem_manual";

type DecisaoRolagem = {
  acompanhar: boolean;
  comportamento: ScrollBehavior | null;
};

/**
 * Mantém a política de acompanhamento explícita e testável. Uma atualização
 * passiva nunca retira o cliente de mensagens antigas; ações deliberadas de
 * envio ou retorno às recentes reativam o acompanhamento.
 */
export function decidirRolagemConversa({
  acompanhando,
  evento,
  proximoDoFim = false,
}: {
  acompanhando: boolean;
  evento: EventoRolagemConversa;
  proximoDoFim?: boolean;
}): DecisaoRolagem {
  if (evento === "historico_recuperado") {
    return { acompanhar: true, comportamento: "auto" };
  }
  if (evento === "envio_cliente" || evento === "ir_para_recentes") {
    return { acompanhar: true, comportamento: "smooth" };
  }
  if (evento === "rolagem_manual") {
    return {
      acompanhar: proximoDoFim,
      comportamento: proximoDoFim ? "smooth" : null,
    };
  }
  return {
    acompanhar: acompanhando,
    comportamento: acompanhando ? "smooth" : null,
  };
}
