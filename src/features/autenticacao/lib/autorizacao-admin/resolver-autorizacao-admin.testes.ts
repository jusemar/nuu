import assert from "node:assert/strict";
import test from "node:test";

import { PERMISSOES_ADMIN } from "../../constants/permissoes-administrativas";
import type { DadosAutorizacaoAdministrador } from "../../types/autorizacao-admin.types";
import { ErroAutorizacaoAdmin } from "./erros-autorizacao-admin";
import {
  exigirPermissaoNoContexto,
  podeAdmin,
  resolverContextoAdministrativo,
} from "./resolver-autorizacao-admin";

const PRODUTOS_VISUALIZAR = PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR;
const PRODUTOS_PUBLICAR = PERMISSOES_ADMIN.PRODUTOS.PUBLICAR;
const PEDIDOS_VISUALIZAR = PERMISSOES_ADMIN.PEDIDOS.VISUALIZAR;

function dadosAtivos(
  parcial: Partial<DadosAutorizacaoAdministrador> = {},
): DadosAutorizacaoAdministrador {
  return {
    administrador: {
      administradorPrincipal: false,
      id: "admin-1",
      status: "ativo",
      versaoAutorizacao: 3,
    },
    chavesAtivasCatalogo: [
      PRODUTOS_VISUALIZAR,
      PRODUTOS_PUBLICAR,
      PEDIDOS_VISUALIZAR,
      PERMISSOES_ADMIN.ATENDENTE_IA.ACESSAR,
    ],
    concessoesFuncoes: [],
    overrides: [],
    ...parcial,
  };
}

function contexto(dados: DadosAutorizacaoAdministrador | null) {
  return resolverContextoAdministrativo({
    dados,
    userId: "user-1",
  });
}

function codigoDoErro(execucao: () => unknown) {
  assert.throws(execucao, (erro) => {
    assert.ok(erro instanceof ErroAutorizacaoAdmin);
    return true;
  });
  try {
    execucao();
  } catch (erro) {
    return (erro as ErroAutorizacaoAdmin).codigo;
  }
  return null;
}

test("nega usuário sem sessão e usuário comum sem vínculo", () => {
  const semSessao = resolverContextoAdministrativo({
    dados: null,
    userId: null,
  });
  assert.equal(
    codigoDoErro(() =>
      exigirPermissaoNoContexto(semSessao, PRODUTOS_VISUALIZAR),
    ),
    "NAO_AUTENTICADO",
  );
  assert.equal(
    codigoDoErro(() =>
      exigirPermissaoNoContexto(contexto(null), PRODUTOS_VISUALIZAR),
    ),
    "SEM_VINCULO_ADMINISTRATIVO",
  );
});

test("email configurado sem vínculo persistido não concede acesso", () => {
  const semVinculo = resolverContextoAdministrativo({
    dados: null,
    userId: "user-sem-vinculo",
  });
  assert.equal(semVinculo.situacao, "sem_vinculo");
  assert.equal(semVinculo.origem, "identidade_sem_acesso");
  assert.equal(podeAdmin(semVinculo, PRODUTOS_VISUALIZAR), false);
});

test("administrador desativado nega tudo e preserva a versão no contexto", () => {
  const desativado = contexto(
    dadosAtivos({
      administrador: {
        administradorPrincipal: true,
        id: "admin-1",
        status: "desativado",
        versaoAutorizacao: 8,
      },
    }),
  );
  assert.equal(desativado.situacao, "desativado");
  assert.equal(desativado.versaoAutorizacao, 8);
  assert.equal(podeAdmin(desativado, PRODUTOS_VISUALIZAR), false);
  assert.equal(
    codigoDoErro(() =>
      exigirPermissaoNoContexto(desativado, PRODUTOS_VISUALIZAR),
    ),
    "ADMINISTRADOR_DESATIVADO",
  );
});

test("função ativa concede e ausência permanece negada", () => {
  const acesso = contexto(
    dadosAtivos({
      concessoesFuncoes: [
        {
          funcaoAtiva: true,
          permissaoAtiva: true,
          permissao: PRODUTOS_VISUALIZAR,
        },
      ],
    }),
  );
  assert.equal(podeAdmin(acesso, PRODUTOS_VISUALIZAR), true);
  assert.equal(podeAdmin(acesso, PRODUTOS_PUBLICAR), false);
});

test("múltiplas funções contribuem por união", () => {
  const acesso = contexto(
    dadosAtivos({
      concessoesFuncoes: [
        {
          funcaoAtiva: true,
          permissaoAtiva: true,
          permissao: PRODUTOS_VISUALIZAR,
        },
        {
          funcaoAtiva: true,
          permissaoAtiva: true,
          permissao: PEDIDOS_VISUALIZAR,
        },
      ],
    }),
  );
  assert.equal(podeAdmin(acesso, PRODUTOS_VISUALIZAR), true);
  assert.equal(podeAdmin(acesso, PEDIDOS_VISUALIZAR), true);
});

test("override permitir concede e override negar prevalece sobre função", () => {
  const permitir = contexto(
    dadosAtivos({
      overrides: [
        {
          efeito: "permitir",
          permissaoAtiva: true,
          permissao: PRODUTOS_PUBLICAR,
        },
      ],
    }),
  );
  assert.equal(podeAdmin(permitir, PRODUTOS_PUBLICAR), true);

  const negar = contexto(
    dadosAtivos({
      concessoesFuncoes: [
        {
          funcaoAtiva: true,
          permissaoAtiva: true,
          permissao: PRODUTOS_VISUALIZAR,
        },
      ],
      overrides: [
        {
          efeito: "negar",
          permissaoAtiva: true,
          permissao: PRODUTOS_VISUALIZAR,
        },
      ],
    }),
  );
  assert.equal(podeAdmin(negar, PRODUTOS_VISUALIZAR), false);
});

test("principal global ativo permite qualquer chave válida e ativa", () => {
  const principal = contexto(
    dadosAtivos({
      administrador: {
        administradorPrincipal: true,
        id: "admin-principal",
        status: "ativo",
        versaoAutorizacao: 2,
      },
    }),
  );
  assert.equal(podeAdmin(principal, PRODUTOS_PUBLICAR), true);
  assert.equal(podeAdmin(principal, PEDIDOS_VISUALIZAR), true);
});

test("permissão ou função desativada não concede", () => {
  const acesso = contexto(
    dadosAtivos({
      concessoesFuncoes: [
        {
          funcaoAtiva: false,
          permissaoAtiva: true,
          permissao: PRODUTOS_VISUALIZAR,
        },
        {
          funcaoAtiva: true,
          permissaoAtiva: false,
          permissao: PRODUTOS_PUBLICAR,
        },
      ],
      overrides: [
        {
          efeito: "permitir",
          permissaoAtiva: false,
          permissao: PRODUTOS_PUBLICAR,
        },
      ],
    }),
  );
  assert.equal(podeAdmin(acesso, PRODUTOS_VISUALIZAR), false);
  assert.equal(podeAdmin(acesso, PRODUTOS_PUBLICAR), false);
});

test("catálogo desativado e chave desconhecida permanecem fail-closed", () => {
  const semChaveAtiva = contexto(
    dadosAtivos({
      chavesAtivasCatalogo: [PRODUTOS_VISUALIZAR],
      overrides: [
        {
          efeito: "permitir",
          permissaoAtiva: true,
          permissao: PRODUTOS_PUBLICAR,
        },
      ],
    }),
  );
  assert.equal(podeAdmin(semChaveAtiva, PRODUTOS_PUBLICAR), false);
  assert.equal(
    podeAdmin(semChaveAtiva, "inexistente.acessar" as typeof PRODUTOS_PUBLICAR),
    false,
  );
});

test("Atendente IA participa somente pela chave global de entrada", () => {
  const acesso = contexto(
    dadosAtivos({
      concessoesFuncoes: [
        {
          funcaoAtiva: true,
          permissaoAtiva: true,
          permissao: PERMISSOES_ADMIN.ATENDENTE_IA.ACESSAR,
        },
      ],
    }),
  );
  assert.equal(podeAdmin(acesso, PERMISSOES_ADMIN.ATENDENTE_IA.ACESSAR), true);
  for (const papelLocal of ["gestor_principal", "revisor", "visualizador"]) {
    assert.equal(JSON.stringify(acesso).includes(papelLocal), false);
  }
});
