import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

/**
 * Guarda da regra do Next.js: um arquivo com a diretiva `"use server"` só pode exportar
 * funções async.
 *
 * Este teste existe porque a violação não aparece em `tsc` nem em lint — o código compila,
 * passa no type-check e só quebra em tempo de execução, quando o usuário clica no botão:
 *
 *   POST /admin/logistica/pagamento-na-entrega 500
 *   A "use server" file can only export async functions, found object.
 *
 * Foi exatamente o que aconteceu com `ESTADO_INICIAL_KILL_SWITCH`, um objeto de estado
 * inicial exportado ao lado da action. O conserto foi mover os objetos para `constants/` e
 * os tipos para `types/`; este teste impede que a combinação volte por descuido.
 *
 * `export type` continua permitido: tipos são apagados na compilação e nunca chegam ao
 * pacote que o Next inspeciona em tempo de execução.
 */

const PASTA_ACTIONS = join(
  process.cwd(),
  "src/features/pagamento-na-entrega/actions",
);

/** Lista recursivamente os arquivos `.ts` da pasta de actions. */
function listarArquivosTs(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);

    if (entrada.isDirectory()) return listarArquivosTs(caminho);
    if (!entrada.name.endsWith(".ts")) return [];
    if (entrada.name.endsWith(".testes.ts")) return [];

    return [caminho];
  });
}

/**
 * Devolve as linhas de `export` que NÃO são função async nem tipo.
 *
 * A checagem é textual de propósito: é a mesma leitura que o compilador do Next faz sobre a
 * forma do arquivo, e não depende de executar nada.
 */
function encontrarExportacoesInvalidas(conteudo: string): string[] {
  return conteudo
    .split("\n")
    .filter((linha) => linha.startsWith("export "))
    .filter((linha) => {
      const permitidas = [
        /^export async function /,
        /^export default async function /,
        /^export type /,
        /^export interface /,
        /^export type\b/,
        /^export \{[^}]*\} from /, // reexport puro de tipos é resolvido no import
      ];

      return !permitidas.some((padrao) => padrao.test(linha));
    });
}

describe('actions com "use server" só exportam funções async', () => {
  const arquivos = listarArquivosTs(PASTA_ACTIONS);

  it("encontra os arquivos de action da feature", () => {
    assert.ok(
      arquivos.length >= 5,
      `esperava pelo menos 5 actions, encontrei ${arquivos.length}`,
    );
  });

  arquivos.forEach((caminho) => {
    const conteudo = readFileSync(caminho, "utf8");
    const nome = caminho.split("/").slice(-1)[0];

    if (!conteudo.startsWith('"use server"')) return;

    it(`${nome} não exporta objeto, constante ou classe`, () => {
      const invalidas = encontrarExportacoesInvalidas(conteudo);

      assert.deepEqual(
        invalidas,
        [],
        `${nome} tem exportação não-async — mova para constants/ ou types/:\n  ${invalidas.join("\n  ")}`,
      );
    });
  });
});
