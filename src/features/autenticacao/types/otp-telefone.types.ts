export type FinalidadeOtpTelefone =
  | "cadastro"
  | "verificacao"
  | "recuperacao"
  | "alteracao_numero";

export type DadosDesafioOtpTelefone = {
  id: string;
  telefoneHash: string;
  ipHash: string;
  finalidade: FinalidadeOtpTelefone;
  codigoHash: string;
  expiraEm: Date;
  agora: Date;
};

export type ResultadoEmissaoOtp =
  | { permitido: true }
  | {
      permitido: false;
      motivo: "REENVIO" | "LIMITE_HORA" | "LIMITE_DIA" | "LIMITE_IP";
    };

export type ResultadoConsumoOtp =
  | "VALIDO"
  | "INVALIDO"
  | "EXPIRADO"
  | "CONSUMIDO"
  | "BLOQUEADO"
  | "INEXISTENTE";

export interface RepositorioOtpTelefone {
  emitir(dados: DadosDesafioOtpTelefone): Promise<ResultadoEmissaoOtp>;
  consumir(entrada: {
    telefoneHash: string;
    finalidade: FinalidadeOtpTelefone;
    codigoHash: string;
    ipHash: string;
    agora: Date;
  }): Promise<ResultadoConsumoOtp>;
  invalidar(
    telefoneHash: string,
    finalidade: FinalidadeOtpTelefone,
  ): Promise<void>;
}
