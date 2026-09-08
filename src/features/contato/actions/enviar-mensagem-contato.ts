"use server";

import { headers } from "next/headers";

import { enviarEmailContato } from "../lib/enviar-email-contato";
import { consumirTentativaContato } from "../lib/limitar-envios-contato";
import { sanitizarTextoContato } from "../lib/sanitizar-formulario-contato";
import { validarTurnstileContato } from "../lib/validar-turnstile-contato";
import { formularioContatoSchema } from "../schemas/formulario-contato.schema";
import type { EstadoEnvioContato } from "../types/estado-envio-contato";

function lerCampo(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? sanitizarTextoContato(valor) : "";
}

export async function enviarMensagemContato(
  _estadoAnterior: EstadoEnvioContato,
  formData: FormData,
): Promise<EstadoEnvioContato> {
  // Resposta neutra impede que robôs descubram o funcionamento do honeypot.
  if (lerCampo(formData, "website")) {
    return {
      status: "sucesso",
      mensagem: "Mensagem enviada. Nossa equipe responderá em breve.",
    };
  }

  const validacao = formularioContatoSchema.safeParse({
    nome: lerCampo(formData, "nome"),
    email: lerCampo(formData, "email"),
    assunto: lerCampo(formData, "assunto"),
    mensagem: lerCampo(formData, "mensagem"),
  });

  if (!validacao.success) {
    const campos = validacao.error.flatten().fieldErrors;
    return {
      status: "validacao",
      mensagem: "Revise os campos destacados.",
      erros: {
        nome: campos.nome?.[0],
        email: campos.email?.[0],
        assunto: campos.assunto?.[0],
        mensagem: campos.mensagem?.[0],
      },
    };
  }

  const cabecalhos = await headers();
  const enderecoIp =
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip")?.trim() ||
    "desconhecido";

  if (!consumirTentativaContato(enderecoIp)) {
    return {
      status: "limite",
      mensagem: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  const token = formData.get("turnstileToken");
  const turnstileValido = await validarTurnstileContato({
    token: typeof token === "string" ? token : "",
    enderecoIp,
    hostnameEsperado:
      cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "",
  });

  if (!turnstileValido) {
    return {
      status: "turnstile",
      mensagem:
        "Não foi possível confirmar a verificação de segurança. Tente novamente.",
    };
  }

  try {
    await enviarEmailContato(validacao.data);
    return {
      status: "sucesso",
      mensagem: "Mensagem enviada. Nossa equipe responderá em breve.",
    };
  } catch (erro) {
    // O conteúdo da mensagem e os dados pessoais nunca são registrados.
    console.error("[contato:email:erro]", {
      tipo: erro instanceof Error ? erro.name : "ErroDesconhecido",
      servico: "resend",
    });
    return {
      status: "erro",
      mensagem:
        "Não foi possível enviar sua mensagem agora. Tente novamente em instantes.",
    };
  }
}
