// Script local: NÃO carrega ambiente por conta própria.
// Ele é lançado por `scripts/lib/executar-script-local.ts` (ver package.json), que valida
// o destino, recusa o endpoint de produção e só então define DATABASE_URL. Importar
// `dotenv/config` aqui reintroduziria o caminho implícito para `.env`, que guarda a URL
// de produção — foi por ali que um seed local acabou consultando o banco principal.

import { garantirDadosIniciaisLogistica } from "@/features/logistica";

async function executar() {
  const resultado = await garantirDadosIniciaisLogistica();
  console.log(JSON.stringify(resultado, null, 2));
}

executar().catch((erro) => {
  console.error("[seed-dados-iniciais-logistica]", erro);
  process.exit(1);
});

