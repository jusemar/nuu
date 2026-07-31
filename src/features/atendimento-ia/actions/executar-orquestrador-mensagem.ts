import "server-only";

import { obterComponenteProcessamentoOpenAi } from "../lib/obter-componente-processamento-openai";
import { obterConfiguracaoAtendenteIa } from "../lib/obter-configuracao-atendente";
import { orquestrarMensagem } from "../lib/orquestrar-mensagem";
import type { IdentidadeEntradaAtendimento } from "../types/entrada-mensagem";
import { RepositorioOrquestradorDrizzle } from "./repositorio-orquestrador-drizzle";

export async function executarOrquestradorMensagem(dados: {
  identidade: IdentidadeEntradaAtendimento;
  mensagemId: string;
}) {
  const configuracao = obterConfiguracaoAtendenteIa();

  return orquestrarMensagem(
    {
      componente: obterComponenteProcessamentoOpenAi(
        configuracao.ATENDENTE_IA_ESCALONAMENTO_ATIVO,
      ),
      memoriaAtiva: configuracao.ATENDENTE_IA_MEMORIA_ATIVA,
      repositorio: new RepositorioOrquestradorDrizzle(),
    },
    dados,
  );
}
