import QRCode from "qrcode";

import { obterConfiguracaoEfi } from "./configuracao-efi";
import { chamarApiPixEfi } from "./cliente-efi";
import type {
  CobrancaPixEfi,
  CriarCobrancaPixEfiInput,
} from "../../../types/efi-pix.types";

const EXPIRACAO_PIX_EM_SEGUNDOS = 3600;

type CobrancaEfiResponse = {
  txid: string;
  loc?: {
    id?: number;
  };
  pixCopiaECola?: string;
};

type QrCodeEfiResponse = {
  qrcode: string;
  imagemQrcode: string;
};

function formatarValorPix(valorEmCentavos: number) {
  return (valorEmCentavos / 100).toFixed(2);
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
}: CriarCobrancaPixEfiInput): Promise<CobrancaPixEfi> {
  const configuracao = obterConfiguracaoEfi();

  const cobranca = await chamarApiPixEfi<CobrancaEfiResponse>({
    metodo: "POST",
    path: "/v2/cob",
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
    expiresAt: new Date(Date.now() + EXPIRACAO_PIX_EM_SEGUNDOS * 1000),
    providerResponse: {
      cobranca,
      qrcode,
    },
  };
}
