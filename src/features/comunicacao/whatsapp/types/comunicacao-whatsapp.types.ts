import type { FINALIDADES_OTP_WHATSAPP } from "../constants/finalidades-otp-whatsapp";

export type FinalidadeOtpWhatsapp = (typeof FINALIDADES_OTP_WHATSAPP)[number];

export type EntradaEnvioOtpWhatsapp = {
  numero: string;
  codigo: string;
  finalidade: FinalidadeOtpWhatsapp;
  identificadorOperacao: string;
};

export type ResultadoEnvioOtpWhatsapp = {
  idMensagem: string;
};

export type ConfiguracaoWhatsappMeta = {
  tokenAcesso: string;
  phoneNumberId: string;
  versaoGraphApi: string;
  nomeTemplateOtp: string;
  idiomaTemplateOtp: string;
};

export type PayloadTemplateAutenticacaoMeta = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: [
      {
        type: "body";
        parameters: [{ type: "text"; text: string }];
      },
      {
        type: "button";
        sub_type: "url";
        index: "0";
        parameters: [{ type: "text"; text: string }];
      },
    ];
  };
};
