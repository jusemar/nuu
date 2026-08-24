import assert from "node:assert/strict";
import test from "node:test";

import { gerarIdentificador } from "./gerar-identificador";

test("gera identificador canônico a partir do título público", () => {
  assert.equal(
    gerarIdentificador("  Política de Devolução  "),
    "politica-de-devolucao",
  );
  assert.equal(gerarIdentificador("Empresa & Ajuda"), "empresa-ajuda");
});
