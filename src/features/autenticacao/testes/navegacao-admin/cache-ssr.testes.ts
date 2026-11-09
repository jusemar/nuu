import assert from "node:assert/strict";
import test from "node:test";

import { useQuery } from "@tanstack/react-query";
import React from "react";
import { renderToString } from "react-dom/server";

import ReactQueryProvider from "@/providers/react-query";
/** O executor TSX do Node usa JSX clássico; o Next usa seu transformador automático. */
Object.assign(globalThis, { React });
function Perfil({ usuarioId }: { usuarioId: string }) {
  const { data } = useQuery({
    queryKey: ["regressao-perfil-privado"],
    queryFn: async () => ({ usuarioId }),
    initialData: { usuarioId },
  });
  return React.createElement("p", null, data.usuarioId);
}
function renderizar(usuarioId: string) {
  return renderToString(
    React.createElement(
      ReactQueryProvider,
      null,
      React.createElement(Perfil, { usuarioId }),
    ),
  );
}
test("SSR de outra sessão não reutiliza o perfil privado da primeira", () => {
  assert.equal(renderizar("representante-A"), "<p>representante-A</p>");
  assert.equal(renderizar("gestor-B"), "<p>gestor-B</p>");
});
test("intercalar e repetir sessões conserva o titular de cada renderização", () => {
  for (const id of ["A", "B", "A", "C", "B"])
    assert.equal(renderizar(id), `<p>${id}</p>`);
});
