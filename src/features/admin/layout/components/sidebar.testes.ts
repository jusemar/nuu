import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { menuAdmin } from "./sidebar";

describe("menu admin sidebar", () => {
  it("exibe módulos operacionais na seção logística", () => {
    const grupoLogistica = menuAdmin.find((item) => item.id === "logistics");
    assert.ok(grupoLogistica && "items" in grupoLogistica);

    const nomes = (grupoLogistica.items ?? []).map((item) => item.label);
    assert.deepEqual(nomes, [
      "Visão Geral",
      "Integrações",
      "Serviços de Entrega",
      "Regras de Disponibilidade",
      "Retirada",
      "Entrega Própria",
    ]);
  });
});
