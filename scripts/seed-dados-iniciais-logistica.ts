import "dotenv/config";

import { garantirDadosIniciaisLogistica } from "@/features/logistica";

async function executar() {
  const resultado = await garantirDadosIniciaisLogistica();
  console.log(JSON.stringify(resultado, null, 2));
}

executar().catch((erro) => {
  console.error("[seed-dados-iniciais-logistica]", erro);
  process.exit(1);
});

