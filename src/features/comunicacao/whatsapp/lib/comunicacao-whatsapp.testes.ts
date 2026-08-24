import assert from "node:assert/strict";
import test from "node:test";

import { envioOtpWhatsappSchema } from "../schemas/envio-otp-whatsapp.schema";
import type {
  ConfiguracaoWhatsappMeta,
  PayloadTemplateAutenticacaoMeta,
} from "../types/comunicacao-whatsapp.types";
import { obterConfiguracaoWhatsappMeta } from "./configuracao-whatsapp";
import { ErroComunicacaoWhatsapp } from "./erros-whatsapp";
import { mascararTelefoneWhatsapp } from "./mascarar-telefone-whatsapp";
import { enviarTemplatePelaMeta } from "./meta/cliente-meta-whatsapp";
import { normalizarTelefoneAutenticavel } from "./normalizar-telefone-autenticavel";
import { montarTemplateAutenticacaoMeta } from "./templates/montar-template-autenticacao-meta";

const configuracao: ConfiguracaoWhatsappMeta = {
  tokenAcesso: "token-super-secreto",
  phoneNumberId: "123456789",
  versaoGraphApi: "v99.0",
  nomeTemplateOtp: "codigo_autenticacao",
  idiomaTemplateOtp: "pt_BR",
};

const payload = montarTemplateAutenticacaoMeta({
  numero: "+5531999991234",
  codigo: "482913",
  configuracao,
});

test("aceita telefone brasileiro autenticável em E.164 estrito", () => {
  assert.equal(
    normalizarTelefoneAutenticavel("+5531999991234"),
    "+5531999991234",
  );
});

test("recusa número inválido ou ambíguo", () => {
  for (const numero of ["5531999991234", "+5531888881234", "(31) 99999-1234"]) {
    assert.throws(
      () => normalizarTelefoneAutenticavel(numero),
      (erro: unknown) =>
        erro instanceof ErroComunicacaoWhatsapp &&
        erro.codigo === "ENTRADA_INVALIDA",
    );
  }
});

test("mascara telefone sem revelar sua parte central", () => {
  assert.equal(mascararTelefoneWhatsapp("+5531999991234"), "+5531*****1234");
});

test("constrói payload Authentication sem expor o contrato ao chamador", () => {
  assert.deepEqual(payload, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "5531999991234",
    type: "template",
    template: {
      name: "codigo_autenticacao",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: "482913" }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: "482913" }],
        },
      ],
    },
  });
});

test("recusa finalidade arbitrária", () => {
  const resultado = envioOtpWhatsappSchema.safeParse({
    numero: "+5531999991234",
    codigo: "482913",
    finalidade: "marketing",
    identificadorOperacao: "operacao-1",
  });

  assert.equal(resultado.success, false);
});

test("falha somente ao ler uma configuração ausente", () => {
  assert.throws(
    () => obterConfiguracaoWhatsappMeta({}),
    (erro: unknown) =>
      erro instanceof ErroComunicacaoWhatsapp &&
      erro.codigo === "CONFIGURACAO_AUSENTE",
  );
});

test("trata erro HTTP sem incorporar resposta sensível", async () => {
  const segredoResposta = "otp=482913 token=token-super-secreto";
  const fetchSimulado: typeof fetch = async () =>
    new Response(segredoResposta, { status: 400 });

  await assert.rejects(
    enviarTemplatePelaMeta(configuracao, payload, { fetch: fetchSimulado }),
    (erro: unknown) => {
      assert.ok(erro instanceof ErroComunicacaoWhatsapp);
      assert.equal(erro.codigo, "META_HTTP");
      assert.equal(erro.statusHttp, 400);
      assert.doesNotMatch(String(erro), /482913|token-super-secreto/);
      return true;
    },
  );
});

test("trata payload de resposta inválido", async () => {
  const fetchSimulado: typeof fetch = async () =>
    Response.json({ messages: [] });

  await assert.rejects(
    enviarTemplatePelaMeta(configuracao, payload, { fetch: fetchSimulado }),
    (erro: unknown) =>
      erro instanceof ErroComunicacaoWhatsapp &&
      erro.codigo === "RESPOSTA_INVALIDA",
  );
});

test("retorna o identificador em um sucesso simulado", async () => {
  let requisicao: { url: string; init?: RequestInit } | undefined;
  const fetchSimulado: typeof fetch = async (url, init) => {
    requisicao = { url: String(url), init };
    return Response.json({ messages: [{ id: "wamid.simulado" }] });
  };

  const resultado = await enviarTemplatePelaMeta(configuracao, payload, {
    fetch: fetchSimulado,
  });

  assert.deepEqual(resultado, { idMensagem: "wamid.simulado" });
  assert.equal(
    requisicao?.url,
    "https://graph.facebook.com/v99.0/123456789/messages",
  );
  assert.equal(requisicao?.init?.method, "POST");
});

test("não registra OTP, token, telefone ou payload durante falha", async () => {
  const registros: unknown[][] = [];
  const logOriginal = console.log;
  const erroOriginal = console.error;
  console.log = (...itens: unknown[]) => registros.push(itens);
  console.error = (...itens: unknown[]) => registros.push(itens);

  try {
    const fetchSimulado: typeof fetch = async () =>
      new Response("falha", { status: 500 });
    await assert.rejects(
      enviarTemplatePelaMeta(configuracao, payload, { fetch: fetchSimulado }),
    );
  } finally {
    console.log = logOriginal;
    console.error = erroOriginal;
  }

  assert.deepEqual(registros, []);
  assert.doesNotMatch(
    JSON.stringify(registros),
    /482913|token-super-secreto|5531999991234/,
  );
});

// Mantém o tipo importado exercitado: alterações no contrato bruto quebram este teste.
const _validarContratoPayload: PayloadTemplateAutenticacaoMeta = payload;
void _validarContratoPayload;
