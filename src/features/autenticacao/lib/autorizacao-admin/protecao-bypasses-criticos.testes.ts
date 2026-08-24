import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type ProtecaoEsperada = {
  arquivo: string;
  permissoes: string[];
};

const protecoes: ProtecaoEsperada[] = [
  {
    arquivo: "src/app/api/admin/categories/route.ts",
    permissoes: ["CATEGORIAS.VISUALIZAR", "CATEGORIAS.ADMINISTRAR"],
  },
  {
    arquivo: "src/app/api/admin/categories/[id]/route.ts",
    permissoes: ["CATEGORIAS.ADMINISTRAR", "CATEGORIAS.EXCLUIR"],
  },
  {
    arquivo: "src/app/api/upload/route.ts",
    permissoes: ["PRODUTOS.ADMINISTRAR", "BANNERS.ADMINISTRAR"],
  },
  {
    arquivo: "src/actions/admin/products/create.ts",
    permissoes: ["PRODUTOS.ADMINISTRAR"],
  },
  {
    arquivo: "src/actions/admin/products/update.ts",
    permissoes: ["PRODUTOS.ADMINISTRAR"],
  },
  {
    arquivo: "src/actions/admin/products/delete.ts",
    permissoes: ["PRODUTOS.ADMINISTRAR"],
  },
  {
    arquivo: "src/features/products/actions/publicar-produto-admin.ts",
    permissoes: ["PRODUTOS.ADMINISTRAR", "PRODUTOS.PUBLICAR"],
  },
  {
    arquivo:
      "src/features/checkout/actions/pedidos-admin/alterar-status-pedido-admin.ts",
    permissoes: ["PEDIDOS.ADMINISTRAR"],
  },
  {
    arquivo:
      "src/features/checkout/queries/pedidos-admin/buscar-pedido-admin.ts",
    permissoes: ["PEDIDOS.VISUALIZAR"],
  },
  {
    arquivo: "src/features/promocoes/actions/salvar-promocao-admin.ts",
    permissoes: ["MARKETING.ADMINISTRAR", "MARKETING.PUBLICAR"],
  },
  {
    arquivo: "src/features/promocoes/actions/alternar-status-promocao-admin.ts",
    permissoes: ["MARKETING.PUBLICAR"],
  },
  {
    arquivo:
      "src/features/pagamento-na-entrega/actions/admin/confirmar-recebimento-pagamento-entrega-admin.ts",
    permissoes: ["PAGAMENTOS_ENTREGA.ADMINISTRAR"],
  },
];

test("pontos críticos possuem guard server-side com a permissão esperada", () => {
  for (const protecao of protecoes) {
    const fonte = readFileSync(protecao.arquivo, "utf8");
    assert.match(fonte, /exigirPermissaoAdmin\(/, protecao.arquivo);
    for (const permissao of protecao.permissoes) {
      assert.ok(
        fonte.includes(`PERMISSOES_ADMIN.${permissao}`),
        `${protecao.arquivo}: ausência de ${permissao}`,
      );
    }
  }
});

test("upload não aceita pasta livre enviada no corpo", () => {
  const fonte = readFileSync("src/app/api/upload/route.ts", "utf8");
  assert.doesNotMatch(fonte, /formData\.get\(["']destino["']\)/);
  assert.match(fonte, /contexto === "produto"/);
  assert.match(fonte, /contexto === "banner"/);
});

test("consultas públicas de produtos e promoções permanecem fora do RBAC admin", () => {
  const arquivosPublicos = [
    "src/features/products/actions/get-products-load-more.ts",
    "src/features/products/actions/get-products-by-flag.ts",
    "src/features/promocoes/actions/validar-cupom-promocao.ts",
    "src/features/promocoes/queries/buscar-promocoes-validas.ts",
  ];

  for (const arquivo of arquivosPublicos) {
    const fonte = readFileSync(arquivo, "utf8");
    assert.doesNotMatch(fonte, /exigirPermissaoAdmin\(/, arquivo);
  }
});

test("negações de vínculo persistido geram auditoria sem dados de request", () => {
  const fonte = readFileSync(
    "src/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin.ts",
    "utf8",
  );
  assert.match(fonte, /autorizacao\.permissao_negada/);
  assert.match(fonte, /resultado: "negado"/);
  assert.doesNotMatch(fonte, /senha|cookie|token|telefone/i);
});
