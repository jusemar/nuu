import assert from "node:assert/strict";
import test from "node:test";

import {
  type AdministradorParaPolitica,
  ErroPoliticaAdministrador,
  validarOperacaoVinculoAdministrativo,
} from "./politica-gestor-principal";

const principal: AdministradorParaPolitica = {
  administradorPrincipal: true,
  id: "principal-1",
  status: "ativo",
};

function exigirCodigo(
  codigo: ErroPoliticaAdministrador["codigo"],
  fn: () => void,
) {
  assert.throws(fn, (erro) => {
    assert.ok(erro instanceof ErroPoliticaAdministrador);
    assert.equal(erro.codigo, codigo);
    return true;
  });
}

for (const operacao of [
  "desativar",
  "rebaixar_principal",
  "remover",
] as const) {
  test(`bloqueia ${operacao} do último principal ativo`, () => {
    exigirCodigo("ULTIMO_PRINCIPAL_ATIVO", () =>
      validarOperacaoVinculoAdministrativo({
        ator: principal,
        operacao,
        principaisAtivos: [principal.id],
        alvo: principal,
      }),
    );
  });
}

test("permite rebaixar um principal quando outro permanece ativo", () => {
  assert.doesNotThrow(() =>
    validarOperacaoVinculoAdministrativo({
      ator: principal,
      operacao: "rebaixar_principal",
      principaisAtivos: [principal.id, "principal-2"],
      alvo: {
        administradorPrincipal: true,
        id: "principal-2",
        status: "ativo",
      },
    }),
  );
});

test("administrador limitado não promove outro usuário", () => {
  const limitado = {
    administradorPrincipal: false,
    id: "limitado",
    status: "ativo" as const,
  };
  exigirCodigo("ATOR_SEM_AUTORIDADE", () =>
    validarOperacaoVinculoAdministrativo({
      ator: limitado,
      operacao: "promover_principal",
      principaisAtivos: [principal.id],
      alvo: {
        administradorPrincipal: false,
        id: "outro",
        status: "ativo",
      },
    }),
  );
});

test("administrador limitado não consegue elevar a si próprio", () => {
  const limitado = {
    administradorPrincipal: false,
    id: "limitado",
    status: "ativo" as const,
  };
  exigirCodigo("AUTOELEVACAO_BLOQUEADA", () =>
    validarOperacaoVinculoAdministrativo({
      ator: limitado,
      operacao: "promover_principal",
      principaisAtivos: [principal.id],
      alvo: limitado,
    }),
  );
});
