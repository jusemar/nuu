import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { obterCepOrigemLaquila } from "./obter-cep-origem-laquila";

function restaurarVariavel(nome: string, valor: string | undefined) {
  if (valor === undefined) delete process.env[nome];
  else process.env[nome] = valor;
}

descrever("origem logística Laquila", () => {
  verificar("aceita somente oito dígitos", () => {
    const anterior = process.env.LAQUILA_CEP_ORIGEM;
    process.env.LAQUILA_CEP_ORIGEM = "83430000";
    afirmacoes.equal(obterCepOrigemLaquila(), "83430000");
    restaurarVariavel("LAQUILA_CEP_ORIGEM", anterior);
  });

  verificar("não usa fallback quando ausente ou formatado", () => {
    const anterior = process.env.LAQUILA_CEP_ORIGEM;
    const origemLoja = process.env.FRENET_CEP_ORIGEM;
    process.env.FRENET_CEP_ORIGEM = "30668635";
    delete process.env.LAQUILA_CEP_ORIGEM;
    afirmacoes.equal(obterCepOrigemLaquila(), null);
    process.env.LAQUILA_CEP_ORIGEM = "83430-000";
    afirmacoes.equal(obterCepOrigemLaquila(), null);
    restaurarVariavel("LAQUILA_CEP_ORIGEM", anterior);
    restaurarVariavel("FRENET_CEP_ORIGEM", origemLoja);
  });
});
