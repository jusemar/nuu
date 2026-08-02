import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  enviarMensagemChat,
  ErroChatAtendimento,
  recuperarHistoricoChat,
} from "./cliente-chat-atendimento";
import {
  ErroContratoRespostaChat,
  validarContratoRespostaChat,
} from "./contrato-resposta-chat";

const ids = {
  conversa: "11111111-1111-4111-8111-111111111111",
  cliente: "22222222-2222-4222-8222-222222222222",
  resposta: "33333333-3333-4333-8333-333333333333",
};

function respostaValida() {
  return Response.json({
    dados: {
      conversaId: ids.conversa,
      mensagem: {
        autor: "assistente_ia",
        conteudo: "Como posso ajudar?",
        id: ids.resposta,
      },
      mensagemClienteId: ids.cliente,
      transferencia: null,
    },
    sucesso: true,
  });
}

test("envia somente o contrato público e mantém a conversa", async () => {
  let corpo: Record<string, unknown> | undefined;
  const requisitar: typeof fetch = async (_entrada, opcoes) => {
    corpo = JSON.parse(String(opcoes?.body)) as Record<string, unknown>;
    return respostaValida();
  };
  const resultado = await enviarMensagemChat(
    {
      chaveIdempotencia: "44444444-4444-4444-8444-444444444444",
      conversaId: ids.conversa,
      mensagem: "Olá",
    },
    requisitar,
  );
  assert.equal(resultado.conversaId, ids.conversa);
  assert.equal(corpo?.conversaId, ids.conversa);
  assert.equal(corpo?.canal, "site");
  assert.equal("usuarioId" in (corpo ?? {}), false);
  assert.equal("modelo" in (corpo ?? {}), false);
  assert.equal("prompt" in (corpo ?? {}), false);
});

test("preserva idempotência prática ao repetir a mesma tentativa", async () => {
  const corpos: string[] = [];
  const requisitar: typeof fetch = async (_entrada, opcoes) => {
    corpos.push(String(opcoes?.body));
    return respostaValida();
  };
  const dados = {
    chaveIdempotencia: "44444444-4444-4444-8444-444444444444",
    mensagem: "Olá",
  };
  await enviarMensagemChat(dados, requisitar);
  await enviarMensagemChat(dados, requisitar);
  assert.equal(corpos[0], corpos[1]);
});

test("consome HTTP 200 com transferência oferecida e resumo ainda nulo", async () => {
  const resultado = await enviarMensagemChat(
    {
      chaveIdempotencia: "44444444-4444-4444-8444-444444444444",
      mensagem: "Onde fica a loja?",
    },
    async () =>
      Response.json({
        dados: {
          conversaId: ids.conversa,
          mensagem: {
            autor: "assistente_ia",
            conteudo: "Posso encaminhar para a equipe.",
            id: ids.resposta,
          },
          mensagemClienteId: ids.cliente,
          transferencia: {
            explicacao: "Posso encaminhar para a equipe.",
            id: "55555555-5555-4555-8555-555555555555",
            link: null,
            resumo: null,
            status: "oferecido",
          },
        },
        sucesso: true,
      }),
  );

  assert.equal(resultado.transferencia?.status, "oferecido");
  assert.equal(resultado.transferencia?.resumo, null);
  assert.equal(resultado.transferencia?.link, null);
});

test("produtor rejeita HTTP 200 cujo resumo de transferência é objeto vazio", () => {
  assert.throws(
    () =>
      validarContratoRespostaChat({
        dados: {
          conversaId: ids.conversa,
          mensagem: {
            autor: "assistente_ia",
            conteudo: "Posso encaminhar para a equipe.",
            id: ids.resposta,
          },
          mensagemClienteId: ids.cliente,
          transferencia: {
            explicacao: "Posso encaminhar para a equipe.",
            id: "55555555-5555-4555-8555-555555555555",
            link: null,
            resumo: {},
            status: "oferecido",
          },
        },
        sucesso: true,
      }),
    (erro: unknown) =>
      erro instanceof ErroContratoRespostaChat &&
      [
        ...erro.diagnostico.camposAusentes,
        ...erro.diagnostico.camposInvalidos,
      ].some((campo) => campo.startsWith("dados.transferencia.resumo")),
  );
});

test("mantém dez mensagens consecutivas na mesma conversa", async () => {
  const conversasRecebidas: Array<string | undefined> = [];
  const respostas = Array.from({ length: 10 }, () => randomUUID());
  let chamada = 0;
  const requisitar: typeof fetch = async (_entrada, opcoes) => {
    const corpo = JSON.parse(String(opcoes?.body)) as {
      conversaId?: string;
    };
    conversasRecebidas.push(corpo.conversaId);
    chamada += 1;
    return Response.json({
      dados: {
        conversaId: ids.conversa,
        mensagem: {
          autor: "assistente_ia",
          conteudo: `Resposta ${chamada}`,
          id: respostas[chamada - 1],
        },
        mensagemClienteId: ids.cliente,
        transferencia: null,
      },
      sucesso: true,
    });
  };

  let conversaId: string | undefined;
  for (const mensagem of Array.from(
    { length: 10 },
    (_, item) => `Mensagem ${item + 1}`,
  )) {
    const resultado = await enviarMensagemChat(
      {
        chaveIdempotencia: randomUUID(),
        conversaId,
        mensagem,
      },
      requisitar,
    );
    conversaId = resultado.conversaId;
  }

  assert.equal(conversasRecebidas[0], undefined);
  assert.deepEqual(
    conversasRecebidas.slice(1),
    Array.from({ length: 9 }, () => ids.conversa),
  );
});

test("converte falha segura do servidor sem expor detalhes internos", async () => {
  await assert.rejects(
    enviarMensagemChat(
      {
        chaveIdempotencia: "44444444-4444-4444-8444-444444444444",
        mensagem: "Olá",
      },
      async () =>
        Response.json(
          {
            erro: {
              codigo: "PROCESSAMENTO_INDISPONIVEL",
              mensagem: "Tente novamente.",
            },
            sucesso: false,
          },
          { status: 503 },
        ),
    ),
    (erro: unknown) =>
      erro instanceof ErroChatAtendimento &&
      erro.codigo === "PROCESSAMENTO_INDISPONIVEL" &&
      erro.message === "Tente novamente.",
  );
});

test("rejeita resposta vazia ou estruturalmente inválida", async () => {
  await assert.rejects(
    enviarMensagemChat(
      {
        chaveIdempotencia: "44444444-4444-4444-8444-444444444444",
        mensagem: "Olá",
      },
      async () => Response.json({ dados: { resposta: "" }, sucesso: true }),
    ),
    (erro: unknown) =>
      erro instanceof ErroChatAtendimento &&
      erro.codigo === "RESPOSTA_INVALIDA",
  );
});

test("normaliza timeout ou falha de rede para mensagem amigável", async () => {
  await assert.rejects(
    enviarMensagemChat(
      {
        chaveIdempotencia: "44444444-4444-4444-8444-444444444444",
        mensagem: "Olá",
      },
      async () => {
        throw new DOMException("abortado", "AbortError");
      },
    ),
    (erro: unknown) =>
      erro instanceof ErroChatAtendimento &&
      erro.codigo === "REDE_INDISPONIVEL",
  );
});

test("recupera o histórico público da mesma conversa após recarga", async () => {
  const historico = await recuperarHistoricoChat(
    ids.conversa,
    async (entrada) => {
      assert.match(String(entrada), new RegExp(ids.conversa));
      return Response.json({
        dados: {
          conversaId: ids.conversa,
          mensagens: [
            { autor: "cliente", conteudo: "Olá", id: ids.cliente },
            {
              autor: "assistente_ia",
              conteudo: "Como posso ajudar?",
              id: ids.resposta,
            },
          ],
        },
        sucesso: true,
      });
    },
  );
  assert.equal(historico.mensagens.length, 2);
  assert.deepEqual(
    historico.mensagens.map((item) => item.autor),
    ["cliente", "assistente_ia"],
  );
});

test("rejeita histórico incompatível com o contrato público", async () => {
  await assert.rejects(
    recuperarHistoricoChat(ids.conversa, async () =>
      Response.json({
        dados: {
          conversaId: ids.conversa,
          mensagens: [
            { autor: "sistema", conteudo: "interno", id: ids.resposta },
          ],
        },
        sucesso: true,
      }),
    ),
    (erro: unknown) =>
      erro instanceof ErroChatAtendimento &&
      erro.codigo === "RESPOSTA_INVALIDA",
  );
});
