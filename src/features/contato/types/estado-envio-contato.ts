export type EstadoEnvioContato = {
  status: "inicial" | "sucesso" | "validacao" | "turnstile" | "limite" | "erro";
  mensagem?: string;
  erros?: Partial<Record<"nome" | "email" | "assunto" | "mensagem", string>>;
};

export const ESTADO_INICIAL_ENVIO_CONTATO: EstadoEnvioContato = {
  status: "inicial",
};
