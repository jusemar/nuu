import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { describe } from "node:test";

import { CAPACIDADES_BASE_POR_PAPEL_ADMIN } from "../../../constants/admin/capacidades";
import { atualizarCapacidadesAtendimentoIaSchema } from "../../../schemas/admin/permissoes.schema";
import {
  podeAprovarVersaoAtendimentoIa,
  resolverPoliticaAprovacaoAtendimentoIaNoServidor,
} from "./politica-aprovacao";
import type { AtribuicaoPapelAtendimentoIa } from "./resolver-papel-atendimento-ia";
import { resolverPapelAtendimentoIa } from "./resolver-papel-atendimento-ia";
import { verificarCapacidadeAtendimentoIa } from "./verificar-capacidade";

const atribuicaoBase: AtribuicaoPapelAtendimentoIa = {
  ativo: true,
  capacidadesAdicionais: [],
  id: "papel-1",
  origem: "atribuicao_explicita",
  papel: "gestor_principal",
  usuarioId: "usuario-1",
};

describe("papéis e permissões do Atendente IA", () => {
  test("bloqueia usuário sem acesso global mesmo com papel local persistido", () => {
    assert.equal(
      resolverPapelAtendimentoIa({
        atribuicao: atribuicaoBase,
        acessoGlobalAutorizado: false,
      }),
      null,
    );
  });

  test("materializa a matriz completa e preserva capacidades críticas do gestor", () => {
    const gestor = resolverPapelAtendimentoIa({
      atribuicao: atribuicaoBase,
      acessoGlobalAutorizado: true,
    });
    const revisor = resolverPapelAtendimentoIa({
      atribuicao: { ...atribuicaoBase, papel: "revisor" },
      acessoGlobalAutorizado: true,
    });
    const visualizador = resolverPapelAtendimentoIa({
      atribuicao: { ...atribuicaoBase, papel: "visualizador" },
      acessoGlobalAutorizado: true,
    });
    assert.deepEqual(gestor?.capacidades, [
      ...CAPACIDADES_BASE_POR_PAPEL_ADMIN.gestor_principal,
    ]);
    for (const capacidade of [
      "publicacoes_escrita",
      "restauracoes_escrita",
      "papeis_gestao",
      "acoes_criticas_execucao",
    ] as const)
      assert.equal(verificarCapacidadeAtendimentoIa(gestor, capacidade), true);
    for (const capacidade of [
      "publicacoes_escrita",
      "restauracoes_escrita",
      "papeis_gestao",
    ] as const)
      assert.equal(
        verificarCapacidadeAtendimentoIa(revisor, capacidade),
        false,
      );
    assert.equal(
      verificarCapacidadeAtendimentoIa(visualizador, "metricas_leitura"),
      true,
    );
    assert.equal(
      verificarCapacidadeAtendimentoIa(
        visualizador,
        "conversas_sanitizadas_leitura",
      ),
      false,
    );
  });

  test("concede ao visualizador somente a leitura sanitizada adicional", () => {
    const acesso = resolverPapelAtendimentoIa({
      atribuicao: {
        ...atribuicaoBase,
        capacidadesAdicionais: ["conversas_sanitizadas_leitura"],
        papel: "visualizador",
      },
      acessoGlobalAutorizado: true,
    });
    assert.equal(
      verificarCapacidadeAtendimentoIa(acesso, "conversas_sanitizadas_leitura"),
      true,
    );
    assert.equal(
      atualizarCapacidadesAtendimentoIaSchema.safeParse({
        capacidadesAdicionais: ["publicacoes_escrita"],
        usuarioId: "usuario-1",
      }).success,
      false,
    );
  });

  test("atribuição explícita prevalece e papel revogado não é reativado", () => {
    const revisor = resolverPapelAtendimentoIa({
      atribuicao: {
        ...atribuicaoBase,
        origem: "atribuicao_explicita",
        papel: "revisor",
      },
      acessoGlobalAutorizado: true,
    });
    assert.equal(revisor?.papel, "revisor");
    assert.equal(
      resolverPapelAtendimentoIa({
        atribuicao: { ...atribuicaoBase, ativo: false },
        acessoGlobalAutorizado: true,
      }),
      null,
    );
  });

  test("aplica a regra adaptativa de autoaprovação exclusivamente no servidor", async () => {
    assert.equal(
      podeAprovarVersaoAtendimentoIa({
        autorId: "u1",
        quantidadeOutrosAprovadoresAtivos: 0,
        podeRevisar: true,
        usuarioId: "u1",
      }),
      true,
    );
    assert.equal(
      podeAprovarVersaoAtendimentoIa({
        autorId: "u1",
        quantidadeOutrosAprovadoresAtivos: 1,
        podeRevisar: true,
        usuarioId: "u1",
      }),
      false,
    );
    assert.equal(
      await resolverPoliticaAprovacaoAtendimentoIaNoServidor({
        autorId: "u1",
        contarOutrosAprovadoresAtivos: async () => 1,
        podeRevisar: true,
        usuarioId: "u1",
      }),
      false,
    );
  });

  test("não aceita papel ou capacidades arbitrárias enviados pelo cliente", () => {
    assert.equal(
      atualizarCapacidadesAtendimentoIaSchema.safeParse({
        capacidadesAdicionais: ["papeis_gestao"],
        papel: "gestor_principal",
        usuarioId: "usuario-1",
      }).success,
      false,
    );
  });

  test("ações críticas registram auditoria e derivam o ator no servidor", () => {
    for (const arquivo of [
      "atribuir-papel-atendimento-ia.ts",
      "revogar-papel-atendimento-ia.ts",
      "atualizar-capacidades-atendimento-ia.ts",
    ]) {
      const conteudo = readFileSync(
        `src/features/atendimento-ia/actions/permissoes/${arquivo}`,
        "utf8",
      );
      assert.match(
        conteudo,
        /exigirCapacidadeAtendimentoIa\("papeis_gestao"\)/,
      );
      assert.match(conteudo, /registrarAuditoriaPermissaoAtendimentoIa/);
      assert.doesNotMatch(conteudo, /atorId:\s*dados\./);
    }
  });
});
