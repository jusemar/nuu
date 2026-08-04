import "server-only";

import { RepositorioFerramentasPublicasDrizzle } from "../actions/repositorio-ferramentas-publicas-drizzle";
import { fontesFerramentasProtegidasOficiais } from "../queries/fontes-ferramentas-protegidas";
import { fontesFerramentasPublicasOficiais } from "../queries/fontes-ferramentas-publicas";
import { configuracaoContextoSchema } from "../schemas/configuracao-contexto.schema";
import { configuracaoOpenAiSchema } from "../schemas/configuracao-openai.schema";
import {
  type ComponenteProcessamentoOrquestrado,
  FalhaComponenteOrquestrado,
} from "../types/orquestrador";
import type { ComportamentoEfetivo } from "./admin/publicacao/resolver-versao-publicada-comportamento";
import { resolverVersaoPublicadaComportamento } from "./admin/publicacao/resolver-versao-publicada-comportamento";
import { ClienteResponsesOpenAiOficial } from "./cliente-responses-openai";
import { criarComponenteProcessamentoOpenAi } from "./componente-processamento-openai";
import { criarCatalogoFerramentasProtegidas } from "./ferramentas-protegidas/catalogo-ferramentas-protegidas";
import {
  combinarExecutoresFerramentas,
  criarExecutorFerramentasProtegidas,
} from "./ferramentas-protegidas/executar-ferramenta-protegida";
import { criarRegistroFerramentasAutorizadas } from "./ferramentas-protegidas/registro-ferramentas-autorizadas";
import { ResolvedorSessaoExistente } from "./ferramentas-protegidas/resolvedor-sessao-existente";
import { criarCatalogoFerramentasPublicas } from "./ferramentas-publicas/catalogo-ferramentas-publicas";
import { criarExecutorFerramentasPublicas } from "./ferramentas-publicas/executar-ferramenta-publica";

export async function obterComponenteProcessamentoOpenAi(
  escalonamentoAtivo: boolean,
  comportamentoResolvido?: ComportamentoEfetivo,
): Promise<ComponenteProcessamentoOrquestrado> {
  // O adapter determinístico existe somente para a validação local da UI. A
  // condição de produção impede que uma variável acidental simule respostas
  // no ambiente real.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ATENDENTE_IA_ADAPTER_MOCK_LOCAL === "true"
  ) {
    return {
      async processar() {
        return {
          conteudoResposta:
            "Olá! Este é o retorno local seguro do Atendente IA. Como posso continuar ajudando?",
          metadados: {
            duracaoEmMs: 0,
            modelo: "gpt-5.6-terra",
            motivoEscalonamento: null,
            respostaId: "mock-local-sem-chamada-openai",
            tokensEntrada: 0,
            tokensSaida: 0,
          },
          tipo: "encaminhar_geracao_resposta",
        };
      },
    };
  }

  const validacao = configuracaoOpenAiSchema.safeParse(process.env);
  const contexto = configuracaoContextoSchema.safeParse(process.env);
  if (!validacao.success || !contexto.success) {
    return {
      async processar() {
        throw new FalhaComponenteOrquestrado("definitiva", "falta_autorizacao");
      },
    };
  }

  const catalogoPublico = criarCatalogoFerramentasPublicas(
    fontesFerramentasPublicasOficiais,
  );
  const catalogoProtegido = criarCatalogoFerramentasProtegidas(
    fontesFerramentasProtegidasOficiais,
  );
  const repositorio = new RepositorioFerramentasPublicasDrizzle();
  const executorPublico = criarExecutorFerramentasPublicas({
    catalogo: catalogoPublico,
    repositorio,
  });
  const executorProtegido = criarExecutorFerramentasProtegidas({
    catalogo: catalogoProtegido,
    repositorio,
    resolvedorSessao: new ResolvedorSessaoExistente(),
  });
  const registro = criarRegistroFerramentasAutorizadas({
    protegidas: catalogoProtegido,
    publicas: catalogoPublico,
  });
  const comportamento =
    comportamentoResolvido ?? (await resolverVersaoPublicadaComportamento());
  return criarComponenteProcessamentoOpenAi({
    cliente: new ClienteResponsesOpenAiOficial(validacao.data.OPENAI_API_KEY),
    configuracao: {
      escalonamentoAtivo,
      maxOutputTokens: validacao.data.OPENAI_ATENDENTE_MAX_OUTPUT_TOKENS,
      maxTentativas: validacao.data.OPENAI_ATENDENTE_MAX_TENTATIVAS,
      timeoutEmMs: validacao.data.OPENAI_ATENDENTE_TIMEOUT_MS,
      maxContextTokens: contexto.data.ATENDENTE_IA_CONTEXTO_MAX_TOKENS,
    },
    executorFerramentas: combinarExecutoresFerramentas(
      executorPublico,
      executorProtegido,
      new Set(catalogoProtegido.keys()),
    ),
    ferramentas: [...registro.values()]
      .filter(
        (ferramenta) => ferramenta.habilitada && ferramenta.handlerAutorizado,
      )
      .map((ferramenta) => ferramenta.definicao),
    instrucoesSistema: comportamento.instrucoes,
  });
}
