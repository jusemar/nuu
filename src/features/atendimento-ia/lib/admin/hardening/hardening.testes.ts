import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ler = (arquivo: string) => readFile(arquivo, "utf8");

test("barrels público e administrativo permanecem isolados", async () => {
  const publico = await ler("src/features/atendimento-ia/index.ts");
  const administrativo = await ler("src/features/atendimento-ia/admin.ts");
  assert.doesNotMatch(publico, /components\/admin|queries\/admin|admin\.ts/);
  assert.match(publico, /components\/store/);
  assert.match(administrativo, /components\/admin/);
  assert.doesNotMatch(administrativo, /components\/store/);
});

test("criações de versão e reordenação possuem lock transacional por recurso", async () => {
  for (const arquivo of [
    "actions/conhecimento/criar-versao-conhecimento.ts",
    "actions/comportamento/criar-versao-comportamento.ts",
    "actions/testes/criar-versao-caso-teste.ts",
    "actions/testes/reordenar-casos-conjunto.ts",
  ]) {
    const fonte = await ler(`src/features/atendimento-ia/${arquivo}`);
    assert.match(fonte, /pg_advisory_xact_lock/);
    assert.match(fonte, /exigirCapacidadeAtendimentoIa/);
  }
});

test("comportamento administrativo exige publicação concluída e datada", async () => {
  const fonte = await ler(
    "src/features/atendimento-ia/lib/admin/publicacao/resolver-versao-publicada-comportamento.ts",
  );
  assert.match(fonte, /status, "concluida"/);
  assert.match(fonte, /publicadoEm/);
  assert.match(fonte, /ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS !== "true"/);
});

test("laboratório não importa orquestrador ou ferramentas reais", async () => {
  const arquivos = [
    "src/features/atendimento-ia/lib/admin/laboratorio/executor-laboratorio.ts",
    "src/features/atendimento-ia/actions/testes/executor-laboratorio-interno.ts",
  ];
  for (const arquivo of arquivos) {
    const fonte = await ler(arquivo);
    assert.doesNotMatch(
      fonte,
      /executar-orquestrador|repositorio-orquestrador|ferramentas-protegidas|ferramentas-publicas/,
    );
    assert.match(
      fonte,
      /efeitosReaisPermitidos:\s*false|efeitosReais:\s*"proibidos"|validarEfeitoRealProibido|validarIsolamentoLaboratorio|tools:\s*\[\]/,
    );
  }
});

test("contratos públicos preservam Responses API privada e Structured Outputs", async () => {
  const componente = await ler(
    "src/features/atendimento-ia/lib/componente-processamento-openai.ts",
  );
  assert.match(componente, /store:\s*false/);
  assert.match(componente, /type:\s*"json_schema"/);
  assert.match(componente, /strict:\s*true/);
});

test("flag permanece desativada por padrão e não foi habilitada em arquivo exemplo", async () => {
  const exemplo = await ler(".env.example");
  assert.match(exemplo, /^ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS=false$/m);
  assert.doesNotMatch(exemplo, /^ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS=true$/m);
});
