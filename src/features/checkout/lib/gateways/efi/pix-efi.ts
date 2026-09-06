import { createHash } from "node:crypto";

import QRCode from "qrcode";

import type {
  CobrancaPixEfi,
  CriarCobrancaPixEfiInput,
} from "../../../types/efi-pix.types";
import { chamarApiPixEfi } from "./cliente-efi";
import { obterConfiguracaoEfi } from "./configuracao-efi";

export const EXPIRACAO_PIX_EM_SEGUNDOS = 7200;

type CobrancaEfiResponse = {
  txid: string;
  calendario?: {
    criacao?: string;
    expiracao?: number;
  };
  loc?: {
    id?: number;
  };
  pixCopiaECola?: string;
};

type QrCodeEfiResponse = {
  qrcode: string;
  imagemQrcode: string;
};

export type ConsultaCobrancaPixEfi = {
  status?: string;
  txid?: string;
  calendario?: {
    criacao?: string;
    expiracao?: number;
  };
  valor?: {
    original?: string;
  };
  pix?: Array<{
    endToEndId?: string;
    txid?: string;
    valor?: string;
    horario?: string;
    devolucoes?: unknown[];
  }>;
};

function formatarValorPix(valorEmCentavos: number) {
  return (valorEmCentavos / 100).toFixed(2);
}

export function resolverExpiracaoCobrancaPixEfi(
  calendario: CobrancaEfiResponse["calendario"],
  agora = new Date(),
) {
  const expiracaoEmSegundos = calendario?.expiracao;
  const criacaoEmMilissegundos = calendario?.criacao
    ? new Date(calendario.criacao).getTime()
    : Number.NaN;

  if (
    Number.isFinite(criacaoEmMilissegundos) &&
    typeof expiracaoEmSegundos === "number" &&
    expiracaoEmSegundos > 0
  ) {
    return new Date(criacaoEmMilissegundos + expiracaoEmSegundos * 1000);
  }

  return new Date(agora.getTime() + EXPIRACAO_PIX_EM_SEGUNDOS * 1000);
}

/**
 * A Efí aceita de 26 a 35 caracteres alfanuméricos no txid informado pelo lojista.
 * Derivar o valor do número único do pedido torna o PUT idempotente até quando a rede
 * cai depois de a cobrança nascer e antes de conseguirmos persistir a resposta.
 */
export function gerarTxidPixEfiDoPedido(numeroPedido: string, geracao = 1) {
  if (!Number.isInteger(geracao) || geracao < 1) {
    throw new Error("A geração do Pix deve ser um inteiro positivo.");
  }

  return createHash("sha256")
    .update(
      geracao === 1
        ? `nooo:pedido:${numeroPedido}`
        : `nooo:pedido:${numeroPedido}:geracao:${geracao}`,
    )
    .digest("hex")
    .slice(0, 32);
}

function montarDevedorPix({
  nome,
  documento,
}: Pick<CriarCobrancaPixEfiInput, "nome" | "documento">) {
  const documentoLimpo = documento.replace(/\D/g, "");

  if (documentoLimpo.length === 11) {
    return {
      cpf: documentoLimpo,
      nome,
    };
  }

  return {
    cnpj: documentoLimpo,
    nome,
  };
}

export async function criarCobrancaPixEfi({
  numeroPedido,
  nome,
  documento,
  valorEmCentavos,
  geracao = 1,
}: CriarCobrancaPixEfiInput): Promise<CobrancaPixEfi> {
  const configuracao = obterConfiguracaoEfi();
  const txid = gerarTxidPixEfiDoPedido(numeroPedido, geracao);

  const cobranca = await chamarApiPixEfi<CobrancaEfiResponse>({
    metodo: "PUT",
    path: `/v2/cob/${txid}`,
    body: {
      calendario: {
        expiracao: EXPIRACAO_PIX_EM_SEGUNDOS,
      },
      devedor: montarDevedorPix({ nome, documento }),
      valor: {
        original: formatarValorPix(valorEmCentavos),
      },
      chave: configuracao.pixKey,
      solicitacaoPagador: `Pedido ${numeroPedido}`,
    },
  });

  const locId = cobranca.loc?.id;

  if (!locId) {
    throw new Error("Efí não retornou o location da cobrança Pix.");
  }

  const copiaECola = cobranca.pixCopiaECola;

  if (!copiaECola) {
    throw new Error("Efí não retornou o Pix copia e cola.");
  }

  const qrcode = await chamarApiPixEfi<QrCodeEfiResponse>({
    metodo: "GET",
    path: `/v2/loc/${locId}/qrcode`,
  }).catch(async (error) => ({
    qrcode: copiaECola,
    imagemQrcode: await QRCode.toDataURL(copiaECola, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
    }),
    fallbackLocal: error instanceof Error ? error.message : "fallback_local",
  }));

  return {
    txid: cobranca.txid,
    qrCode: qrcode.imagemQrcode,
    copiaECola: qrcode.qrcode || copiaECola,
    expiresAt: resolverExpiracaoCobrancaPixEfi(cobranca.calendario),
    providerResponse: {
      controlePix: {
        geracao,
        expiracaoEmSegundos: EXPIRACAO_PIX_EM_SEGUNDOS,
      },
      cobranca,
      qrcode,
    },
  };
}

export async function consultarCobrancaPixEfi(txid: string) {
  return chamarApiPixEfi<ConsultaCobrancaPixEfi>({
    metodo: "GET",
    path: `/v2/cob/${encodeURIComponent(txid)}`,
  });
}
