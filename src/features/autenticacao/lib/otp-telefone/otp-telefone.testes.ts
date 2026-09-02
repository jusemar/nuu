import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type {
  DadosDesafioOtpTelefone,
  FinalidadeOtpTelefone,
  RepositorioOtpTelefone,
  ResultadoConsumoOtp,
} from "../../types/otp-telefone.types";
import { autenticarTelefoneSenha } from "../telefone/autenticar-telefone-senha";
import { POLITICA_OTP_TELEFONE } from "./politica-otp-telefone";
import { criarServicoOtpTelefone } from "./servico-otp-telefone";

class RepositorioOtpMemoria implements RepositorioOtpTelefone {
  desafios = new Map<
    string,
    DadosDesafioOtpTelefone & { tentativas: number; consumido: boolean }
  >();
  emissoes: Array<{ telefoneHash: string; ipHash: string; data: Date }> = [];

  private chave(hash: string, finalidade: FinalidadeOtpTelefone) {
    return `${hash}:${finalidade}`;
  }

  async emitir(dados: DadosDesafioOtpTelefone) {
    const hora = dados.agora.getTime() - 60 * 60 * 1_000;
    const dia = dados.agora.getTime() - 24 * 60 * 60 * 1_000;
    const numero = this.emissoes.filter(
      (item) => item.telefoneHash === dados.telefoneHash,
    );
    const ultima = numero.at(-1);
    if (ultima && dados.agora.getTime() - ultima.data.getTime() < 60_000)
      return { permitido: false, motivo: "REENVIO" } as const;
    if (numero.filter((item) => item.data.getTime() >= hora).length >= 5)
      return { permitido: false, motivo: "LIMITE_HORA" } as const;
    if (numero.filter((item) => item.data.getTime() >= dia).length >= 10)
      return { permitido: false, motivo: "LIMITE_DIA" } as const;
    if (
      this.emissoes.filter(
        (item) => item.ipHash === dados.ipHash && item.data.getTime() >= hora,
      ).length >= 5
    )
      return { permitido: false, motivo: "LIMITE_IP" } as const;

    this.desafios.set(this.chave(dados.telefoneHash, dados.finalidade), {
      ...dados,
      tentativas: 0,
      consumido: false,
    });
    this.emissoes.push({
      telefoneHash: dados.telefoneHash,
      ipHash: dados.ipHash,
      data: dados.agora,
    });
    return { permitido: true } as const;
  }

  async consumir(entrada: {
    telefoneHash: string;
    finalidade: FinalidadeOtpTelefone;
    codigoHash: string;
    ipHash: string;
    agora: Date;
  }): Promise<ResultadoConsumoOtp> {
    const desafio = this.desafios.get(
      this.chave(entrada.telefoneHash, entrada.finalidade),
    );
    if (!desafio) return "INEXISTENTE";
    if (desafio.consumido) return "CONSUMIDO";
    if (desafio.expiraEm <= entrada.agora) return "EXPIRADO";
    if (desafio.tentativas >= 3) return "BLOQUEADO";
    if (
      desafio.codigoHash !== entrada.codigoHash ||
      desafio.ipHash !== entrada.ipHash
    ) {
      desafio.tentativas += 1;
      return desafio.tentativas >= 3 ? "BLOQUEADO" : "INVALIDO";
    }
    desafio.consumido = true;
    return "VALIDO";
  }

  async invalidar(telefoneHash: string, finalidade: FinalidadeOtpTelefone) {
    const desafio = this.desafios.get(this.chave(telefoneHash, finalidade));
    if (desafio) desafio.consumido = true;
  }
}

function cenario() {
  const repositorio = new RepositorioOtpMemoria();
  const envios: Array<{ numero: string; codigo: string; finalidade: string }> =
    [];
  let instante = new Date("2026-08-23T12:00:00.000Z");
  let codigo = "123456";
  const eventos: Array<Record<string, unknown>> = [];
  const servico = criarServicoOtpTelefone({
    repositorio,
    segredo: "segredo-de-teste-comprido",
    agora: () => instante,
    gerarCodigo: () => codigo,
    enviar: async (entrada) => void envios.push(entrada),
    registrarEvento: (evento) => eventos.push(evento),
  });
  return {
    repositorio,
    envios,
    eventos,
    servico,
    avancar(ms: number) {
      instante = new Date(instante.getTime() + ms);
    },
    trocarCodigo(novo: string) {
      codigo = novo;
    },
  };
}

const entrada = {
  telefone: "+5531999991234",
  ip: "203.0.113.10",
  finalidade: "verificacao" as const,
};

test("configura plugin oficial com política aprovada e bloqueia armazenamento nativo", () => {
  const fonte = readFileSync("src/lib/auth.ts", "utf8");
  assert.match(fonte, /phoneNumber\(\{/);
  assert.match(fonte, /requireVerification: true/);
  assert.match(fonte, /otpLength: 6/);
  assert.match(fonte, /expiresIn: 5 \* 60/);
  assert.match(fonte, /"\/phone-number\/send-otp"/);
  assert.match(fonte, /pluginFluxosTelefoneNuu\(\)/);
});

test("telefone não verificado não autentica", async () => {
  const resultado = await autenticarTelefoneSenha({
    usuario: { id: "u1", phoneNumberVerified: false, senhaHash: "hash" },
    senha: "senha",
    verificarSenha: async () => true,
    executarCustoNeutro: async () => undefined,
  });
  assert.equal(resultado, null);
});

test("telefone verificado e senha correta autentica", async () => {
  const resultado = await autenticarTelefoneSenha({
    usuario: { id: "u1", phoneNumberVerified: true, senhaHash: "hash" },
    senha: "correta",
    verificarSenha: async (senha) => senha === "correta",
    executarCustoNeutro: async () => undefined,
  });
  assert.equal(resultado, "u1");
});

test("senha incorreta produz falha neutra", async () => {
  const resultado = await autenticarTelefoneSenha({
    usuario: { id: "u1", phoneNumberVerified: true, senhaHash: "hash" },
    senha: "incorreta",
    verificarSenha: async () => false,
    executarCustoNeutro: async () => undefined,
  });
  assert.equal(resultado, null);
});

test("OTP correto é consumido uma única vez", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "123456" }),
    "VALIDO",
  );
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "123456" }),
    "CONSUMIDO",
  );
});

test("OTP incorreto falha", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "000000" }),
    "INVALIDO",
  );
});

test("OTP expirado em cinco minutos falha", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  caso.avancar(POLITICA_OTP_TELEFONE.validadeSegundos * 1_000 + 1);
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "123456" }),
    "EXPIRADO",
  );
});

test("reenvio invalida o OTP anterior da mesma finalidade", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  caso.avancar(60_001);
  caso.trocarCodigo("654321");
  await caso.servico.emitir(entrada);
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "123456" }),
    "INVALIDO",
  );
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "654321" }),
    "VALIDO",
  );
});

test("três tentativas bloqueiam o desafio", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "000000" }),
    "INVALIDO",
  );
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "000001" }),
    "INVALIDO",
  );
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "000002" }),
    "BLOQUEADO",
  );
  assert.equal(
    await caso.servico.confirmar({ ...entrada, codigo: "123456" }),
    "BLOQUEADO",
  );
});

test("impõe intervalo mínimo de sessenta segundos", async () => {
  const caso = cenario();
  assert.deepEqual(await caso.servico.emitir(entrada), { permitido: true });
  assert.deepEqual(await caso.servico.emitir(entrada), {
    permitido: false,
    motivo: "REENVIO",
  });
});

test("limita cinco emissões por hora por número", async () => {
  const caso = cenario();
  for (let i = 0; i < 5; i += 1) {
    assert.deepEqual(await caso.servico.emitir(entrada), { permitido: true });
    caso.avancar(60_001);
  }
  assert.deepEqual(await caso.servico.emitir(entrada), {
    permitido: false,
    motivo: "LIMITE_HORA",
  });
});

test("limita dez emissões por vinte e quatro horas por número", async () => {
  const caso = cenario();
  for (let i = 0; i < 10; i += 1) {
    assert.deepEqual(await caso.servico.emitir(entrada), { permitido: true });
    caso.avancar(61 * 60 * 1_000);
  }
  assert.deepEqual(await caso.servico.emitir(entrada), {
    permitido: false,
    motivo: "LIMITE_DIA",
  });
});

test("limita emissões também por IP", async () => {
  const caso = cenario();
  for (let i = 0; i < 5; i += 1) {
    assert.deepEqual(
      await caso.servico.emitir({
        ...entrada,
        telefone: `+55319999912${30 + i}`,
      }),
      { permitido: true },
    );
    caso.avancar(60_001);
  }
  assert.deepEqual(
    await caso.servico.emitir({ ...entrada, telefone: "+5531999991299" }),
    { permitido: false, motivo: "LIMITE_IP" },
  );
});

test("finalidades são isoladas", async () => {
  const caso = cenario();
  await caso.servico.emitir({ ...entrada, finalidade: "cadastro" });
  assert.equal(
    await caso.servico.confirmar({
      ...entrada,
      finalidade: "recuperacao",
      codigo: "123456",
    }),
    "INEXISTENTE",
  );
});

test("OTP administrativo não pode ser consumido como recuperação de cliente", async () => {
  const caso = cenario();
  await caso.servico.emitir({ ...entrada, finalidade: "admin_recuperacao" });
  assert.equal(
    await caso.servico.confirmar({
      ...entrada,
      finalidade: "recuperacao",
      codigo: "123456",
    }),
    "INEXISTENTE",
  );
  assert.equal(
    await caso.servico.confirmar({
      ...entrada,
      finalidade: "admin_recuperacao",
      codigo: "123456",
    }),
    "VALIDO",
  );
});

test("OTP de cliente não pode ser consumido na recuperação administrativa", async () => {
  const caso = cenario();
  await caso.servico.emitir({ ...entrada, finalidade: "recuperacao" });
  assert.equal(
    await caso.servico.confirmar({
      ...entrada,
      finalidade: "admin_recuperacao",
      codigo: "123456",
    }),
    "INEXISTENTE",
  );
});

test("OTP administrativo incorreto não é validado", async () => {
  const caso = cenario();
  const entradaAdmin = { ...entrada, finalidade: "admin_recuperacao" as const };
  await caso.servico.emitir(entradaAdmin);
  assert.equal(
    await caso.servico.confirmar({ ...entradaAdmin, codigo: "000000" }),
    "INVALIDO",
  );
});

test("OTP administrativo expirado não é validado", async () => {
  const caso = cenario();
  const entradaAdmin = { ...entrada, finalidade: "admin_recuperacao" as const };
  await caso.servico.emitir(entradaAdmin);
  caso.avancar(POLITICA_OTP_TELEFONE.validadeSegundos * 1_000 + 1);
  assert.equal(
    await caso.servico.confirmar({ ...entradaAdmin, codigo: "123456" }),
    "EXPIRADO",
  );
});

test("recuperação administrativa preserva cooldown", async () => {
  const caso = cenario();
  const entradaAdmin = { ...entrada, finalidade: "admin_recuperacao" as const };
  assert.deepEqual(await caso.servico.emitir(entradaAdmin), {
    permitido: true,
  });
  assert.deepEqual(await caso.servico.emitir(entradaAdmin), {
    permitido: false,
    motivo: "REENVIO",
  });
});

test("alteração de número chega ao transporte com finalidade sanitizada", async () => {
  const caso = cenario();
  await caso.servico.emitir({ ...entrada, finalidade: "alteracao_numero" });

  assert.equal(caso.envios.length, 1);
  assert.equal(caso.envios[0]?.finalidade, "alteracao_numero");
  assert.deepEqual(
    caso.eventos.map((evento) => evento.evento),
    ["EMISSAO_AVALIADA", "ENVIO_INICIADO", "ENVIO_ACEITO"],
  );
  assert.equal(caso.eventos[0]?.finalidade, "alteracao_numero");
  assert.doesNotMatch(JSON.stringify(caso.eventos), /123456|\+5531999991234/);
});

test("validação de outro IP conta como tentativa inválida", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  assert.equal(
    await caso.servico.confirmar({
      ...entrada,
      ip: "198.51.100.8",
      codigo: "123456",
    }),
    "INVALIDO",
  );
});

test("observabilidade registra somente finalidade, estado e identificador sanitizado", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  const serializado = JSON.stringify(caso.eventos);
  assert.doesNotMatch(serializado, /123456|\+5531999991234/);
  assert.deepEqual(
    caso.eventos.map((evento) => evento.evento),
    ["EMISSAO_AVALIADA", "ENVIO_INICIADO", "ENVIO_ACEITO"],
  );
  assert.equal(caso.eventos[0]?.finalidade, "verificacao");
  assert.equal(caso.eventos[0]?.motivo, "PERMITIDO");
  assert.equal(String(caso.eventos[0]?.identificador).length, 12);
  assert.equal(caso.envios.length, 1);
});

test("observabilidade informa bloqueio sem iniciar transporte", async () => {
  const caso = cenario();
  await caso.servico.emitir(entrada);
  caso.eventos.length = 0;
  await caso.servico.emitir(entrada);
  assert.deepEqual(caso.eventos, [
    {
      evento: "EMISSAO_AVALIADA",
      finalidade: "verificacao",
      identificador: caso.eventos[0]?.identificador,
      motivo: "REENVIO",
    },
  ]);
  assert.equal(caso.envios.length, 1);
});

test("falha de transporte é observada sem expor telefone ou OTP", async () => {
  const repositorio = new RepositorioOtpMemoria();
  const eventos: Array<Record<string, unknown>> = [];
  const servico = criarServicoOtpTelefone({
    repositorio,
    segredo: "segredo-de-teste-comprido",
    gerarCodigo: () => "123456",
    enviar: async () => {
      throw new Error("transporte indisponível");
    },
    registrarEvento: (evento) => eventos.push(evento),
  });

  await assert.rejects(() => servico.emitir(entrada));
  assert.equal(eventos.at(-1)?.evento, "FALHA_TRANSPORTE");
  assert.doesNotMatch(JSON.stringify(eventos), /123456|\+5531999991234/);
});

test("recuperação é neutra e revoga sessões no backend", () => {
  const fonte = readFileSync(
    "src/features/autenticacao/lib/plugin-fluxos-telefone-nuu.ts",
    "utf8",
  );
  assert.match(fonte, /mensagemNeutra/);
  assert.match(fonte, /deleteSessions\(usuario\.id\)/);
  assert.match(fonte, /finalidade: "recuperacao"/);
});

test("alteração exige sessão, OTP e revoga outras sessões", () => {
  const fonte = readFileSync(
    "src/features/autenticacao/lib/plugin-fluxos-telefone-nuu.ts",
    "utf8",
  );
  assert.match(fonte, /getSessionFromCtx/);
  assert.match(fonte, /finalidade: "alteracao_numero"/);
  assert.match(fonte, /phoneNumberVerified: true/);
  assert.match(fonte, /ne\(sessionTable\.id, sessao\.session\.id\)/);
  assert.match(fonte, /telefoneDisponivelParaVinculo/);
});

test("schema persistente guarda somente hashes, tentativas e estado", () => {
  const fonte = readFileSync(
    "src/db/tables/autenticacao/tabelas/desafios-otp-telefone.ts",
    "utf8",
  );
  assert.match(fonte, /codigoHash: text\("codigo_hash"\)/);
  assert.match(fonte, /telefoneHash: text\("telefone_hash"\)/);
  assert.doesNotMatch(fonte, /codigo: text|telefone: text/);
});
