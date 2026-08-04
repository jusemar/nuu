import "server-only";

import { resolverVersaoPublicadaComportamento } from "../lib/admin/publicacao/resolver-versao-publicada-comportamento";
import { obterComponenteProcessamentoOpenAi } from "../lib/obter-componente-processamento-openai";
import { obterConfiguracaoAtendenteIa } from "../lib/obter-configuracao-atendente";
import { obterManutentorResumoContexto } from "../lib/obter-manutentor-resumo-contexto";
import { orquestrarMensagem } from "../lib/orquestrar-mensagem";
import { obterRecuperadorFontesInstitucionais } from "../lib/rag/obter-recuperador-fontes-institucionais";
import type { IdentidadeEntradaAtendimento } from "../types/entrada-mensagem";
import { RepositorioOrquestradorDrizzle } from "./repositorio-orquestrador-drizzle";

export async function executarOrquestradorMensagem(dados: {
  identidade: IdentidadeEntradaAtendimento;
  mensagemId: string;
}) {
  const configuracao = obterConfiguracaoAtendenteIa();
  const comportamento = await resolverVersaoPublicadaComportamento();
  const repositorio = new RepositorioOrquestradorDrizzle(comportamento);

  return orquestrarMensagem(
    {
      componente: await obterComponenteProcessamentoOpenAi(
        configuracao.ATENDENTE_IA_ESCALONAMENTO_ATIVO,
        comportamento,
      ),
      contextoExpiraAposDias: (identidade) =>
        identidade.usuarioId
          ? configuracao.ATENDENTE_IA_CONTEXTO_AUTENTICADO_DIAS
          : configuracao.ATENDENTE_IA_CONTEXTO_VISITANTE_DIAS,
      manterContexto: obterManutentorResumoContexto(repositorio),
      memoriaAtiva: configuracao.ATENDENTE_IA_MEMORIA_ATIVA,
      memoriaExpiraAposDias: configuracao.ATENDENTE_IA_MEMORIA_DIAS,
      recuperarFontesInstitucionais: obterRecuperadorFontesInstitucionais({
        configuracao,
        ragAtivo: configuracao.ATENDENTE_IA_RAG_ATIVO,
      }),
      repositorio,
    },
    dados,
  );
}
