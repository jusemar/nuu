import { pathToFileURL } from "node:url";

import { config as carregarDotenv } from "dotenv";

import {
  type AmbienteBanco,
  encerrarComFalhaDeDestino,
  exigirBancoLocal,
} from "./guarda-banco-local";

/**
 * Lançador único dos scripts locais que tocam o banco.
 *
 * Existe por causa de uma característica dos módulos ES: `import` é içado e avaliado antes
 * de qualquer instrução do arquivo. Um script que faz `import { db } from "@/db/connection"`
 * abre a conexão **antes** de qualquer guarda que estivesse escrita no corpo dele — e o
 * `dotenv` de `connection.ts` já teria lido `.env`, ou seja, produção.
 *
 * Este lançador resolve isso trocando a ordem: primeiro valida o destino e fixa
 * `process.env.DATABASE_URL`, e só então importa o script alvo dinamicamente. Quando o alvo
 * finalmente avaliar seus imports, a variável já aponta para o banco certo.
 *
 * Uso (sempre via package.json):
 *   AMBIENTE_BANCO=desenvolvimento tsx scripts/lib/executar-script-local.ts <caminho-do-script>
 */
async function executar() {
  const caminhoAlvo = process.argv[2];

  if (!caminhoAlvo) {
    throw new Error(
      "Informe o caminho do script a executar. Use os comandos do package.json.",
    );
  }

  // Por padrão só desenvolvimento. Um comando pode ampliar via AMBIENTES_ACEITOS, mas
  // "producao" nunca entra aqui — operação em produção tem caminho próprio.
  const ambientesAceitos = (process.env.AMBIENTES_ACEITOS?.trim()
    ? process.env.AMBIENTES_ACEITOS.split(",").map((item) => item.trim())
    : ["desenvolvimento"]) as AmbienteBanco[];

  if (ambientesAceitos.includes("producao")) {
    throw new Error(
      "O lançador local nunca opera em produção. Use um comando dedicado.",
    );
  }

  // Carrega as demais variáveis da aplicação (chaves de API, flags). O `dotenv` não
  // sobrescreve o que já existe e respeita a ordem da lista, então `.env.local` vence.
  // `DATABASE_URL` que venha daqui é irrelevante: a guarda abaixo a define por último.
  carregarDotenv({ path: [".env.local", ".env"] });

  await exigirBancoLocal(ambientesAceitos);

  console.log(`[executar-script-local] iniciando ${caminhoAlvo}\n`);

  await import(pathToFileURL(caminhoAlvo).href);
}

executar().catch(encerrarComFalhaDeDestino);
