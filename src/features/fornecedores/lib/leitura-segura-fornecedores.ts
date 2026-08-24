import "server-only";

/**
 * Proteção única para TODAS as leituras de banco do fluxo de importação de fornecedores.
 *
 * Por que existe
 * --------------
 * As telas de Mapeamento, Vinculação, Conciliação e Publicação leem o banco pelo cliente
 * `db` (`drizzle-orm/neon-http`), que fala com o Neon por HTTP. Esse cliente **não tem
 * retentativa**: o comentário em `src/db/connection.ts` menciona "retry", mas o objeto
 * `fetchOptions` só repassa opções nativas do `fetch` — nenhuma retentativa é implementada.
 *
 * Consequência prática: qualquer soluço de rede ou hibernação do Neon (plano free) derruba
 * a consulta na primeira tentativa. Pior, o driver joga um erro cujo `message` embute o SQL
 * inteiro ("Failed query: select count(*) from ...") — e, sem ninguém capturando, o React
 * Server Component estoura e esse texto técnico chega ao navegador do usuário.
 *
 * O que este helper faz
 * ---------------------
 * 1. Repete a leitura um número pequeno de vezes, mas **só** quando a falha é transitória
 *    (conexão, timeout, indisponibilidade). Erro de SQL ou de permissão falha de imediato,
 *    porque repetir não resolveria e só atrasaria a resposta.
 * 2. Registra o detalhe técnico **apenas no servidor**, com contexto suficiente para
 *    investigar (etapa, importação, tentativa, erro original).
 * 3. Lança sempre um `ErroLeituraFornecedores` com texto amigável. O SQL nunca sai daqui.
 *
 * Este arquivo é o único ponto onde essa política existe. Cada query do pipeline apenas o
 * chama — assim a regra não fica duplicada nem diverge com o tempo.
 */

/**
 * Erro que pode ser exibido ao usuário sem revisão.
 *
 * A `error boundary` da rota renderiza `erro.message` diretamente, então a única garantia
 * que importa é: nada que chegue aqui carrega SQL, nome de coluna ou string de conexão.
 */
export class ErroLeituraFornecedores extends Error {
  /** Etapa do fluxo onde a leitura falhou. Usado no log e para diagnóstico. */
  readonly etapa: string;

  constructor(mensagem: string, etapa: string) {
    super(mensagem);
    this.name = "ErroLeituraFornecedores";
    this.etapa = etapa;
  }
}

/**
 * Códigos que caracterizam indisponibilidade momentânea — vale a pena tentar de novo.
 *
 * Os `E*` vêm da camada de socket do Node; os numéricos são `SQLSTATE` da classe 08
 * (falha de conexão) e da classe 57 (operador/servidor encerrou a conexão), exatamente o
 * que acontece quando o endpoint do Neon estava hibernando ou acabou de reciclar.
 */
const CODIGOS_FALHA_TRANSITORIA = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "08P01",
  "53300",
  "57P01",
  "57P02",
  "57P03",
]);

/**
 * Trechos de mensagem usados como segunda linha de detecção.
 *
 * O `@neondatabase/serverless` nem sempre preenche `code` — quando o `fetch` falha antes de
 * chegar ao Postgres, sobra só um texto genérico. Sem esta lista, essas falhas (que são
 * justamente as mais comuns em hibernação) seriam classificadas como definitivas.
 */
const TRECHOS_FALHA_TRANSITORIA = [
  "fetch failed",
  "failed to fetch",
  "network",
  "socket hang up",
  "timeout",
  "timed out",
  "connection terminated",
  "connection closed",
  "terminating connection",
  "error connecting to database",
  "service unavailable",
  "too many connections",
  "econnreset",
  "load balancer",
];

/** Espera simples entre tentativas. */
function esperar(milissegundos: number) {
  return new Promise((resolver) => setTimeout(resolver, milissegundos));
}

/**
 * Percorre a cadeia de causas do erro.
 *
 * O Drizzle embrulha o erro do driver (`DrizzleQueryError` → `cause`), e o driver do Neon
 * ainda pode embrulhar o erro do `fetch` (`sourceError`). Olhar só o erro de fora faria
 * toda falha de rede parecer erro de consulta.
 */
function coletarCadeiaDeErros(erro: unknown): unknown[] {
  const cadeia: unknown[] = [];
  let atual: unknown = erro;

  // O limite de 5 evita laço infinito caso algum driver aponte a causa para si mesmo.
  for (let nivel = 0; nivel < 5 && atual; nivel += 1) {
    cadeia.push(atual);

    const registro = atual as { cause?: unknown; sourceError?: unknown };
    atual = registro.cause ?? registro.sourceError;
  }

  return cadeia;
}

/** Decide se vale repetir a leitura. Na dúvida, NÃO repete (falha rápido e explícito). */
function ehFalhaTransitoria(erro: unknown): boolean {
  return coletarCadeiaDeErros(erro).some((elo) => {
    const registro = elo as { code?: unknown; message?: unknown };
    const codigo =
      typeof registro.code === "string" ? registro.code.toUpperCase() : null;

    if (codigo && CODIGOS_FALHA_TRANSITORIA.has(codigo)) return true;

    const mensagem =
      typeof registro.message === "string"
        ? registro.message.toLowerCase()
        : "";

    return TRECHOS_FALHA_TRANSITORIA.some((trecho) =>
      mensagem.includes(trecho),
    );
  });
}

/**
 * Erros de controle de fluxo do Next (`redirect()`, `notFound()`) viajam como exceção.
 *
 * Se este helper os capturasse, um `notFound()` viraria "não foi possível carregar" em vez
 * de página 404. Eles são identificados pelo `digest` e repassados sem tratamento.
 */
function ehControleDeFluxoDoNext(erro: unknown): boolean {
  const digest = (erro as { digest?: unknown })?.digest;

  return typeof digest === "string" && digest.startsWith("NEXT_");
}

type ContextoLeituraFornecedores = {
  /** Onde a leitura acontece, ex.: `"vinculacao:listar-staging-paginado"`. Vai para o log. */
  etapa: string;
  /** Preservado em todos os logs para amarrar a falha à importação certa. */
  importacaoId?: string;
  /** Texto exibido ao usuário. Deve dizer o que fazer, não o que quebrou. */
  mensagemAmigavel: string;
  /** Total de tentativas (a primeira já conta). Padrão 3. */
  tentativas?: number;
};

/**
 * Executa uma leitura protegida.
 *
 * Uso pretendido: envolver o corpo da query inteira, e não cada `db.select`. Assim, quando
 * uma query dispara várias consultas em paralelo (`Promise.all`), a retentativa refaz o
 * conjunto coerente — repetir metade produziria resultado inconsistente.
 */
export async function executarLeituraFornecedores<T>(
  contexto: ContextoLeituraFornecedores,
  leitura: () => Promise<T>,
): Promise<T> {
  const totalTentativas = Math.max(1, contexto.tentativas ?? 3);
  let ultimoErro: unknown = null;

  for (let tentativa = 1; tentativa <= totalTentativas; tentativa += 1) {
    try {
      return await leitura();
    } catch (erro) {
      if (ehControleDeFluxoDoNext(erro)) throw erro;

      ultimoErro = erro;

      const podeRepetir =
        tentativa < totalTentativas && ehFalhaTransitoria(erro);

      console.error("[fornecedores] falha ao ler dados da importação", {
        etapa: contexto.etapa,
        importacaoId: contexto.importacaoId ?? null,
        tentativa,
        totalTentativas,
        transitorio: podeRepetir,
        momento: new Date().toISOString(),
        erro,
      });

      if (!podeRepetir) break;

      // Espera crescente (300ms, 900ms...) com uma folga aleatória de até 200ms.
      // O aleatório importa porque a página dispara várias leituras ao mesmo tempo: sem
      // ele, todas repetiriam no mesmo instante e recriariam a rajada que causou a falha.
      await esperar(300 * 3 ** (tentativa - 1) + Math.random() * 200);
    }
  }

  // Chega aqui apenas com falha definitiva. O erro original já foi registrado acima e
  // deliberadamente NÃO vira `cause`: anexá-lo faria o SQL reaparecer no rastro que o
  // Next serializa para o cliente em desenvolvimento.
  void ultimoErro;

  throw new ErroLeituraFornecedores(contexto.mensagemAmigavel, contexto.etapa);
}
