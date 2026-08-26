import assert from "node:assert/strict";
import test from "node:test";

import { enviarRecuperacaoEmailPorPublico } from "./enviar-recuperacao-email";

const origem = "https://nooo.com.br";

function urlReset(callback: string) {
  return `${origem}/api/auth/reset-password/token-super-secreto?callbackURL=${encodeURIComponent(callback)}`;
}

test("admin válido usa somente o transporte Resend administrativo simulado", async () => {
  let chamadasAdmin = 0;
  let chamadasCliente = 0;

  const publico = await enviarRecuperacaoEmailPorPublico(
    {
      administrador: true,
      destinatario: "admin@exemplo.com",
      emailTecnico: false,
      origemPermitida: origem,
      urlRedefinicao: urlReset("/admin/redefinir-senha"),
    },
    {
      enviarAdmin: async () => {
        chamadasAdmin += 1;
      },
      enviarCliente: async () => {
        chamadasCliente += 1;
      },
    },
  );

  assert.equal(publico, "admin");
  assert.equal(chamadasAdmin, 1);
  assert.equal(chamadasCliente, 0);
});

test("cliente válido usa somente o transporte de cliente", async () => {
  let chamadasAdmin = 0;
  let chamadasCliente = 0;

  const publico = await enviarRecuperacaoEmailPorPublico(
    {
      administrador: false,
      destinatario: "cliente@exemplo.com",
      emailTecnico: false,
      origemPermitida: origem,
      urlRedefinicao: urlReset("/authentication/recuperar/redefinir"),
    },
    {
      enviarAdmin: async () => {
        chamadasAdmin += 1;
      },
      enviarCliente: async () => {
        chamadasCliente += 1;
      },
    },
  );

  assert.equal(publico, "cliente");
  assert.equal(chamadasAdmin, 0);
  assert.equal(chamadasCliente, 1);
});

test("callback externo é bloqueado e o aviso não contém e-mail ou token", async () => {
  const avisos: string[] = [];
  let chamadas = 0;

  const publico = await enviarRecuperacaoEmailPorPublico(
    {
      administrador: true,
      destinatario: "admin-secreto@exemplo.com",
      emailTecnico: false,
      origemPermitida: origem,
      urlRedefinicao: urlReset("https://malicioso.test/redefinir"),
    },
    {
      enviarAdmin: async () => {
        chamadas += 1;
      },
      enviarCliente: async () => {
        chamadas += 1;
      },
      registrarAviso: (evento) => avisos.push(evento),
    },
  );

  const logSerializado = JSON.stringify(avisos);
  assert.equal(publico, null);
  assert.equal(chamadas, 0);
  assert.deepEqual(avisos, ["PUBLICO_RECUPERACAO_INCOMPATIVEL"]);
  assert.equal(logSerializado.includes("admin-secreto@exemplo.com"), false);
  assert.equal(logSerializado.includes("token-super-secreto"), false);
});
