import type {
  FinalidadeOtpTelefone,
  RepositorioOtpTelefone,
  ResultadoConsumoOtp,
} from "../../types/otp-telefone.types";
import {
  criarHashCodigoOtp,
  criarHashIdentificador,
  gerarCodigoOtpTelefone,
  gerarIdentificadorOperacaoOtp,
} from "./criptografia-otp-telefone";
import { POLITICA_OTP_TELEFONE } from "./politica-otp-telefone";

type DependenciasServico = {
  repositorio: RepositorioOtpTelefone;
  segredo: string;
  enviar: (entrada: {
    numero: string;
    codigo: string;
    finalidade: FinalidadeOtpTelefone;
    identificadorOperacao: string;
  }) => Promise<void>;
  agora?: () => Date;
  gerarCodigo?: () => string;
};

export function criarServicoOtpTelefone(dependencias: DependenciasServico) {
  const agora = dependencias.agora ?? (() => new Date());

  return {
    async emitir(entrada: {
      telefone: string;
      ip: string;
      finalidade: FinalidadeOtpTelefone;
    }) {
      const instante = agora();
      const codigo = (dependencias.gerarCodigo ?? gerarCodigoOtpTelefone)();
      const telefoneHash = criarHashIdentificador(
        entrada.telefone,
        dependencias.segredo,
      );
      const ipHash = criarHashIdentificador(entrada.ip, dependencias.segredo);
      const codigoHash = criarHashCodigoOtp({
        codigo,
        telefoneHash,
        finalidade: entrada.finalidade,
        segredo: dependencias.segredo,
      });
      const resultado = await dependencias.repositorio.emitir({
        id: gerarIdentificadorOperacaoOtp(),
        telefoneHash,
        ipHash,
        finalidade: entrada.finalidade,
        codigoHash,
        agora: instante,
        expiraEm: new Date(
          instante.getTime() + POLITICA_OTP_TELEFONE.validadeSegundos * 1_000,
        ),
      });

      if (!resultado.permitido) return resultado;

      try {
        await dependencias.enviar({
          numero: entrada.telefone,
          codigo,
          finalidade: entrada.finalidade,
          identificadorOperacao: gerarIdentificadorOperacaoOtp(),
        });
      } catch (erro) {
        await dependencias.repositorio.invalidar(
          telefoneHash,
          entrada.finalidade,
        );
        throw erro;
      }

      return resultado;
    },

    async confirmar(entrada: {
      telefone: string;
      codigo: string;
      ip: string;
      finalidade: FinalidadeOtpTelefone;
    }): Promise<ResultadoConsumoOtp> {
      const telefoneHash = criarHashIdentificador(
        entrada.telefone,
        dependencias.segredo,
      );
      return dependencias.repositorio.consumir({
        telefoneHash,
        finalidade: entrada.finalidade,
        codigoHash: criarHashCodigoOtp({
          codigo: entrada.codigo,
          telefoneHash,
          finalidade: entrada.finalidade,
          segredo: dependencias.segredo,
        }),
        ipHash: criarHashIdentificador(entrada.ip, dependencias.segredo),
        agora: agora(),
      });
    },
  };
}
