import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { menuAdmin } from "@/features/admin/layout/components/sidebar";
import {
  ROTAS_TREINAMENTO_ADMIN,
  ROTAS_TREINAMENTO_ADMIN_POR_ID,
} from "@/features/atendimento-ia/constants/admin/rotas-treinamento";

import { conhecimentosControladosAdmin } from "../../lib/admin/dados-controlados/conhecimentos";
import { execucaoLaboratorioControladaAdmin } from "../../lib/admin/dados-controlados/testes";
import { conhecimentoAdminSchema } from "../../schemas/admin/conhecimento.schema";
import { execucaoLaboratorioAdminSchema } from "../../schemas/admin/laboratorio.schema";

const raiz = process.cwd();
const rotaBase = path.join(raiz, "src/app/admin/atendente-ia/treinamento");
const componentesAdmin = path.join(
  raiz,
  "src/features/atendimento-ia/components/admin",
);

function ler(caminho: string) {
  return readFileSync(caminho, "utf8");
}

describe("interface administrativa de treinamento", () => {
  it("mantém somente as cinco rotas aprovadas", () => {
    assert.deepEqual(
      ROTAS_TREINAMENTO_ADMIN.map((item) => item.href),
      [
        "/admin/atendente-ia/treinamento",
        "/admin/atendente-ia/treinamento/conhecimentos",
        "/admin/atendente-ia/treinamento/revisoes",
        "/admin/atendente-ia/treinamento/testes",
        "/admin/atendente-ia/treinamento/metricas",
      ],
    );
    assert.equal(
      ROTAS_TREINAMENTO_ADMIN.some((item) =>
        item.href.includes("treinamento-melhoria"),
      ),
      false,
    );
    assert.deepEqual(ROTAS_TREINAMENTO_ADMIN_POR_ID, {
      conhecimentos: "/admin/atendente-ia/treinamento/conhecimentos",
      metricas: "/admin/atendente-ia/treinamento/metricas",
      revisoes: "/admin/atendente-ia/treinamento/revisoes",
      testes: "/admin/atendente-ia/treinamento/testes",
      visaoGeral: "/admin/atendente-ia/treinamento",
    });
    const inicio = ler(
      path.join(componentesAdmin, "inicio/pagina-inicio-treinamento.tsx"),
    );
    assert.doesNotMatch(inicio, /ROTAS_TREINAMENTO_ADMIN\s*\[\s*[1-4]\s*\]/);
  });

  it("mantém componentes administrativos fora do barrel público", () => {
    const barrelPublico = ler(
      path.join(raiz, "src/features/atendimento-ia/index.ts"),
    );
    assert.doesNotMatch(barrelPublico, /components\/admin/);
    assert.match(barrelPublico, /components\/store/);
  });

  it("possui páginas renderizáveis e estados de carregamento e erro", () => {
    for (const segmento of [
      "",
      "conhecimentos",
      "revisoes",
      "testes",
      "metricas",
    ]) {
      assert.match(
        ler(path.join(rotaBase, segmento, "page.tsx")),
        /export default/,
      );
    }
    assert.match(ler(path.join(rotaBase, "loading.tsx")), /role="status"/);
    assert.match(ler(path.join(rotaBase, "error.tsx")), /role="alert"/);
    assert.match(
      ler(path.join(componentesAdmin, "compartilhados/estado-vazio.tsx")),
      /Nenhum|titulo/,
    );
  });

  it("adiciona uma única entrada compacta ao menu administrativo", () => {
    const grupo = menuAdmin.find((item) => item.id === "atendente-ia");
    assert.ok(grupo && "items" in grupo);
    assert.equal(grupo.label, "Atendente IA");
    assert.deepEqual(
      grupo.items.map((item) => item.label),
      ["Treinamento da IA"],
    );
    assert.equal(
      "href" in grupo.items[0] && grupo.items[0].href,
      ROTAS_TREINAMENTO_ADMIN_POR_ID.visaoGeral,
    );
  });

  it("valida todos os conhecimentos e a execução pelos contratos definitivos", () => {
    assert.equal(
      conhecimentoAdminSchema.array().safeParse(conhecimentosControladosAdmin)
        .success,
      true,
    );
    assert.equal(
      execucaoLaboratorioAdminSchema.safeParse(
        execucaoLaboratorioControladaAdmin,
      ).success,
      true,
    );
    assert.equal(execucaoLaboratorioControladaAdmin.efeitosReais, "proibidos");
  });

  it("mantém perguntas e respostas apenas no módulo Conhecimentos", () => {
    const revisoes = ler(
      path.join(componentesAdmin, "revisoes/pagina-revisoes.tsx"),
    );
    const testes = ler(path.join(componentesAdmin, "testes/pagina-testes.tsx"));
    const metricas = ler(
      path.join(componentesAdmin, "metricas/pagina-metricas.tsx"),
    );
    assert.doesNotMatch(
      `${revisoes}${testes}${metricas}`,
      /Perguntas e respostas/,
    );
    assert.match(
      ler(
        path.join(componentesAdmin, "conhecimentos/pagina-conhecimentos.tsx"),
      ),
      /Perguntas e respostas/,
    );
  });

  it("entrega gestão editorial sem controles de publicação", () => {
    const pagina = ler(
      path.join(componentesAdmin, "conhecimentos/pagina-conhecimentos.tsx"),
    );
    const criacao = ler(
      path.join(
        componentesAdmin,
        "conhecimentos/formulario-criar-conhecimento.tsx",
      ),
    );
    const versao = ler(
      path.join(
        componentesAdmin,
        "conhecimentos/formulario-versao-conhecimento.tsx",
      ),
    );
    const acoes = ler(
      path.join(componentesAdmin, "conhecimentos/acoes-conhecimento.tsx"),
    );
    assert.match(criacao, /Conteúdo oficial/);
    assert.match(criacao, /Pergunta principal/);
    assert.match(versao, /Editar rascunho/);
    assert.match(versao, /Criar nova versão/);
    assert.match(pagina, /Histórico e comparação/);
    assert.match(acoes, /Enviar para revisão/);
    assert.match(acoes, /Arquivar/);
    assert.doesNotMatch(`${pagina}${criacao}${versao}${acoes}`, />Publicar</);
  });

  it("não introduz banco, mutations ou escrita real na superfície visual", () => {
    const arquivos = [
      "inicio/pagina-inicio-treinamento.tsx",
      "conhecimentos/pagina-conhecimentos.tsx",
      "revisoes/pagina-revisoes.tsx",
      "testes/pagina-testes.tsx",
      "metricas/pagina-metricas.tsx",
    ].map((arquivo) => ler(path.join(componentesAdmin, arquivo)));
    const conteudo = arquivos.join("\n");
    assert.doesNotMatch(
      conteudo,
      /@\/db|drizzle|useMutation|server action|"use server"/i,
    );
  });

  it("expõe foco de teclado e estruturas responsivas", () => {
    const navegacao = ler(
      path.join(componentesAdmin, "compartilhados/navegacao-treinamento.tsx"),
    );
    const paginas =
      ler(path.join(componentesAdmin, "inicio/pagina-inicio-treinamento.tsx")) +
      ler(path.join(componentesAdmin, "testes/pagina-testes.tsx"));
    assert.match(navegacao, /focus-visible/);
    assert.match(navegacao, /aria-current/);
    assert.match(paginas, /sm:grid-cols|lg:grid-cols|xl:grid-cols/);
  });
});
