import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decodificarCertificadoEfiBase64,
  obterConfiguracaoEfi,
} from "./configuracao-efi";

const certificadoTeste = Buffer.from("certificado-p12-de-teste");

function variaveisProducao(
  sobrescritas: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    APP_ENVIRONMENT: "producao",
    EFI_CLIENT_ID: "client-id",
    EFI_CLIENT_SECRET: "client-secret",
    EFI_PIX_KEY: "pix-key",
    EFI_CERTIFICATE_BASE64: certificadoTeste.toString("base64"),
    ...sobrescritas,
  };
}

describe("configuração Efí por ambiente", () => {
  it("carrega o certificado Base64 em memória no ambiente de produção", () => {
    const configuracao = obterConfiguracaoEfi(variaveisProducao());

    assert.equal(configuracao.sandbox, false);
    assert.equal(configuracao.baseUrl, "https://pix.api.efipay.com.br");
    assert.deepEqual(configuracao.certificado, certificadoTeste);
  });

  it("não permite fallback de produção para certificado local", () => {
    assert.throws(
      () =>
        obterConfiguracaoEfi(
          variaveisProducao({
            EFI_CERTIFICATE_BASE64: undefined,
            EFI_CERTIFICATE_PATH: "certificados/homologacao.p12",
          }),
        ),
      /EFI_CERTIFICATE_BASE64 não configurada/,
    );
  });

  it("bloqueia combinação de produção com sandbox", () => {
    assert.throws(
      () => obterConfiguracaoEfi(variaveisProducao({ EFI_SANDBOX: "true" })),
      /produção não pode usar sandbox/,
    );
  });

  it("rejeita conteúdo que não seja Base64 íntegro", () => {
    assert.throws(
      () => decodificarCertificadoEfiBase64("não-é-base64"),
      /não contém um Base64 válido/,
    );
  });
});
