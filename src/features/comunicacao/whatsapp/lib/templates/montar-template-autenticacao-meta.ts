import {
  PRODUTO_MENSAGERIA_META,
  TIPO_MENSAGEM_TEMPLATE_META,
} from "../../constants/template-autenticacao-whatsapp";
import type {
  ConfiguracaoWhatsappMeta,
  PayloadTemplateAutenticacaoMeta,
} from "../../types/comunicacao-whatsapp.types";
import { adaptarTelefoneParaMeta } from "../normalizar-telefone-autenticavel";

/** Monta internamente o contrato bruto exigido pelo template Authentication. */
export function montarTemplateAutenticacaoMeta(entrada: {
  numero: string;
  codigo: string;
  configuracao: ConfiguracaoWhatsappMeta;
}): PayloadTemplateAutenticacaoMeta {
  return {
    messaging_product: PRODUTO_MENSAGERIA_META,
    recipient_type: "individual",
    to: adaptarTelefoneParaMeta(entrada.numero),
    type: TIPO_MENSAGEM_TEMPLATE_META,
    template: {
      name: entrada.configuracao.nomeTemplateOtp,
      language: { code: entrada.configuracao.idiomaTemplateOtp },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: entrada.codigo }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: entrada.codigo }],
        },
      ],
    },
  };
}
