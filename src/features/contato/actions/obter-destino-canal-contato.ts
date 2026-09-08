"use server";

import { DADOS_CONTATO_EMPRESA } from "@/features/configuracoes-loja/constants/dados-contato-empresa.server";

export type CanalContatoHumano = "email" | "whatsapp";

type ResultadoDestinoContato =
  | { sucesso: true; destino: string }
  | { sucesso: false; mensagem: string };

/**
 * Mantém os contatos fora do HTML inicial e somente revela o destino depois
 * de uma ação explícita da pessoa visitante.
 */
export async function obterDestinoCanalContato(
  canal: CanalContatoHumano,
): Promise<ResultadoDestinoContato> {
  if (canal === "whatsapp") {
    const numero = DADOS_CONTATO_EMPRESA.telefone.whatsappOperacional.replace(
      /\D/g,
      "",
    );
    if (!/^55\d{10,11}$/.test(numero)) {
      return {
        sucesso: false,
        mensagem: "O WhatsApp está temporariamente indisponível.",
      };
    }

    const mensagem = encodeURIComponent(
      "Olá! Vim pelo site da Nooo e gostaria de atendimento.",
    );
    return {
      sucesso: true,
      destino: `https://wa.me/${numero}?text=${mensagem}`,
    };
  }

  if (canal === "email") {
    const email = DADOS_CONTATO_EMPRESA.emailAtendimento.trim();
    if (!email.includes("@")) {
      return {
        sucesso: false,
        mensagem: "O e-mail está temporariamente indisponível.",
      };
    }

    return {
      sucesso: true,
      destino: `mailto:${email}?subject=${encodeURIComponent("Contato pelo site da Nooo")}`,
    };
  }

  return {
    sucesso: false,
    mensagem: "Canal de atendimento inválido.",
  };
}
