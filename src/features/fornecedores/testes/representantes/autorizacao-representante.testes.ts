import assert from "node:assert/strict";
import test from "node:test";

import { PRESETS_ADMINISTRATIVOS_INICIAIS } from "@/features/administradores/constants/presets-administrativos";
import {
  CATALOGO_PERMISSOES_ADMIN,
  PERMISSOES_ADMIN,
} from "@/features/autenticacao/constants/permissoes-administrativas";
import {
  podeAdmin,
  resolverContextoAdministrativo,
} from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";

import { podeAcessarProdutoRepresentante } from "../../lib/representantes/autorizar-produto-representante";
import type {
  AutorizacaoProdutoRepresentante,
  ContextoRepresentante,
  RecursoProdutoRepresentante,
} from "../../types/representantes/autorizacao-representante.types";

const preset = PRESETS_ADMINISTRATIVOS_INICIAIS.find(
  ({ chave }) => chave === "representante_fornecedor",
)!;
function contexto(
  usuarioId = "usuario-a",
  principal = false,
): ContextoRepresentante {
  return {
    administrativo: resolverContextoAdministrativo({
      userId: usuarioId,
      dados: {
        administrador: {
          id: "admin",
          status: "ativo",
          administradorPrincipal: principal,
          versaoAutorizacao: 1,
        },
        chavesAtivasCatalogo: CATALOGO_PERMISSOES_ADMIN.map(
          ({ chave }) => chave,
        ),
        concessoesFuncoes: preset.permissoes.map((permissao) => ({
          permissao,
          funcaoAtiva: true,
          permissaoAtiva: true,
        })),
        overrides: [],
      },
    }),
    vinculos: [
      {
        id: "vinculo-a",
        usuarioId,
        fornecedorId: "fornecedor-a",
        ativo: true,
        fornecedorAtivo: true,
      },
    ],
  };
}
const recurso: RecursoProdutoRepresentante = {
  fornecedorId: "fornecedor-a",
  produtoId: "produto-a",
  operacao: "visualizar",
};
const liberacoes: AutorizacaoProdutoRepresentante[] = [
  {
    representanteFornecedorId: "vinculo-a",
    produtoId: "produto-a",
    ativa: true,
  },
];

test("nega identidade ausente e vínculo administrativo ausente/desativado", () => {
  for (const administrativo of [
    { situacao: "nao_autenticado" as const },
    resolverContextoAdministrativo({ userId: "usuario-a", dados: null }),
    {
      situacao: "desativado" as const,
      userId: "usuario-a",
      administradorId: "admin",
      administradorPrincipal: false as const,
      origem: "rbac_persistido" as const,
      versaoAutorizacao: 1,
    },
  ])
    assert.equal(
      podeAcessarProdutoRepresentante(
        { ...contexto(), administrativo },
        recurso,
        liberacoes,
      ),
      false,
    );
});

test("permite somente com capacidade, vínculo ativo e liberação individual", () => {
  assert.equal(
    podeAcessarProdutoRepresentante(contexto(), recurso, liberacoes),
    true,
  );
  assert.equal(
    podeAcessarProdutoRepresentante(
      contexto(),
      { ...recurso, operacao: "administrar" },
      liberacoes,
    ),
    false,
  );
});

test("representante sem vínculo ou com vínculo inativo não acessa", () => {
  assert.equal(
    podeAcessarProdutoRepresentante(
      { ...contexto(), vinculos: [] },
      recurso,
      liberacoes,
    ),
    false,
  );
  const caso = contexto();
  caso.vinculos = caso.vinculos.map((vinculo) => ({
    ...vinculo,
    ativo: false,
  }));
  assert.equal(
    podeAcessarProdutoRepresentante(caso, recurso, liberacoes),
    false,
  );
});

test("produto não autorizado e ID adulterado são negados", () => {
  assert.equal(podeAcessarProdutoRepresentante(contexto(), recurso, []), false);
  assert.equal(
    podeAcessarProdutoRepresentante(
      contexto(),
      { ...recurso, produtoId: "produto-b" },
      liberacoes,
    ),
    false,
  );
  assert.equal(
    podeAcessarProdutoRepresentante(
      contexto(),
      { ...recurso, fornecedorId: "fornecedor-b" },
      liberacoes,
    ),
    false,
  );
});

test("revogar liberação ou desativar fornecedor bloqueia novo acesso", () => {
  assert.equal(
    podeAcessarProdutoRepresentante(
      contexto(),
      recurso,
      liberacoes.map((a) => ({ ...a, ativa: false })),
    ),
    false,
  );
  const caso = contexto();
  caso.vinculos = caso.vinculos.map((v) => ({ ...v, fornecedorAtivo: false }));
  assert.equal(
    podeAcessarProdutoRepresentante(caso, recurso, liberacoes),
    false,
  );
});

test("representantes do mesmo fornecedor permanecem isolados", () => {
  const outro = contexto("usuario-b");
  outro.vinculos = outro.vinculos.map((v) => ({ ...v, id: "vinculo-b" }));
  assert.equal(
    podeAcessarProdutoRepresentante(outro, recurso, liberacoes),
    false,
  );
  assert.equal(
    podeAcessarProdutoRepresentante(
      { ...outro, vinculos: contexto().vinculos },
      recurso,
      liberacoes,
    ),
    false,
  );
});

test("múltiplos fornecedores não combinam vínculo de um com liberação de outro", () => {
  const caso = contexto();
  caso.vinculos = [
    ...caso.vinculos,
    {
      id: "vinculo-b",
      usuarioId: "usuario-a",
      fornecedorId: "fornecedor-b",
      ativo: false,
      fornecedorAtivo: true,
    },
  ];
  const autorizacoes = [
    ...liberacoes,
    {
      representanteFornecedorId: "vinculo-b",
      produtoId: "produto-b",
      ativa: true,
    },
  ];
  assert.equal(
    podeAcessarProdutoRepresentante(caso, recurso, autorizacoes),
    true,
  );
  const outroProduto = {
    ...recurso,
    produtoId: "produto-b",
    fornecedorId: "fornecedor-b",
  };
  assert.equal(
    podeAcessarProdutoRepresentante(caso, outroProduto, autorizacoes),
    false,
  );
  caso.vinculos = caso.vinculos.map((v) => ({ ...v, ativo: true }));
  assert.equal(
    podeAcessarProdutoRepresentante(caso, outroProduto, autorizacoes),
    true,
  );
  assert.equal(
    podeAcessarProdutoRepresentante(
      caso,
      { ...outroProduto, fornecedorId: "fornecedor-a" },
      autorizacoes,
    ),
    false,
  );
});

test("nega operação desconhecida mesmo para principal", () => {
  const invalido = {
    ...recurso,
    operacao: "excluir",
  } as unknown as RecursoProdutoRepresentante;
  assert.equal(
    podeAcessarProdutoRepresentante(contexto(), invalido, liberacoes),
    false,
  );
  assert.equal(
    podeAcessarProdutoRepresentante(contexto("gestor", true), invalido, []),
    false,
  );
});

test("revogar capacidade no RBAC vence vínculo e liberação ativos", () => {
  const caso = contexto();
  assert.equal(caso.administrativo.situacao, "ativo");
  if (caso.administrativo.situacao !== "ativo")
    throw new Error("Fixture inválida");
  caso.administrativo = {
    ...caso.administrativo,
    overrides: new Map([
      [PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.VISUALIZAR, "negar"],
    ]),
  };
  assert.equal(
    podeAcessarProdutoRepresentante(caso, recurso, liberacoes),
    false,
  );
  caso.administrativo = {
    ...caso.administrativo,
    permissoesAtivasCatalogo: new Set(),
  };
  assert.equal(
    podeAcessarProdutoRepresentante(caso, recurso, liberacoes),
    false,
  );
});

test("principal mantém acesso global sem liberação individual", () => {
  const principal = contexto("gestor", true);
  principal.vinculos = [];
  assert.equal(podeAcessarProdutoRepresentante(principal, recurso, []), true);
  assert.equal(
    podeAdmin(principal.administrativo, PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR),
    true,
  );
});

test("preset não abre nenhuma capacidade legada global", () => {
  assert.deepEqual([...preset.permissoes].sort(), [
    "representantes_produtos.administrar",
    "representantes_produtos.visualizar",
  ]);
  for (const { chave } of CATALOGO_PERMISSOES_ADMIN) {
    if (!preset.permissoes.includes(chave))
      assert.equal(podeAdmin(contexto().administrativo, chave), false, chave);
  }
});
