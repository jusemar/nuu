import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { validarTokenWebhookPixEfi } from "./seguranca-webhook-efi";

const tokenAnterior = process.env.EFI_WEBHOOK_TOKEN;

afterEach(() => {
  if (tokenAnterior === undefined) delete process.env.EFI_WEBHOOK_TOKEN;
  else process.env.EFI_WEBHOOK_TOKEN = tokenAnterior;
});

describe("autorização do webhook Pix Efí", () => {
  it("nega por padrão quando o segredo não está configurado", () => {
    delete process.env.EFI_WEBHOOK_TOKEN;
    assert.equal(validarTokenWebhookPixEfi({ tokenRecebido: null }), false);
  });

  it("aceita somente o segredo configurado", () => {
    process.env.EFI_WEBHOOK_TOKEN = "segredo-forte";
    assert.equal(
      validarTokenWebhookPixEfi({ tokenRecebido: "segredo-forte" }),
      true,
    );
    assert.equal(
      validarTokenWebhookPixEfi({ tokenRecebido: "incorreto" }),
      false,
    );
  });
});
