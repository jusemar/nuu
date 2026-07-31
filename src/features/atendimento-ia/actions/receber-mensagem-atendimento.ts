import { DURACAO_IDEMPOTENCIA_ENTRADA_EM_MS } from "../constants/entrada-mensagem";
import {
  conversaPertenceAIdentidade,
  criarChavePersistidaMensagem,
  criarEscopoIdempotenciaEntrada,
  criarHashEntradaMensagem,
} from "../lib/seguranca-entrada-mensagem";
import { validarTransicaoEntradaMensagem } from "../lib/transicoes-estado-mensagem";
import type {
  DadosEntradaMensagem,
  IdentidadeEntradaAtendimento,
  RepositorioEntradaAtendimento,
  ResultadoEntradaMensagem,
} from "../types/entrada-mensagem";

export class ErroEntradaAtendimento extends Error {
  constructor(
    public readonly codigo:
      | "CONVERSA_INDISPONIVEL"
      | "IDEMPOTENCIA_CONFLITANTE"
      | "PERSISTENCIA_INDISPONIVEL",
  ) {
    super(codigo);
  }
}

export async function receberMensagemAtendimento(
  repositorio: RepositorioEntradaAtendimento,
  dados: DadosEntradaMensagem,
  identidade: IdentidadeEntradaAtendimento,
): Promise<ResultadoEntradaMensagem> {
  const escopo = criarEscopoIdempotenciaEntrada(identidade);
  const hashRequisicao = criarHashEntradaMensagem(dados, identidade);

  try {
    return await repositorio.executarAtomico(async (transacao) => {
      const idempotenciaExistente =
        await transacao.buscarMensagemPorIdempotencia(
          escopo,
          dados.chaveIdempotencia,
        );

      if (idempotenciaExistente) {
        if (idempotenciaExistente.hashRequisicao !== hashRequisicao) {
          throw new ErroEntradaAtendimento("IDEMPOTENCIA_CONFLITANTE");
        }

        const conversa = await transacao.buscarConversa(
          idempotenciaExistente.mensagem.conversaId,
        );

        if (!conversa || !conversaPertenceAIdentidade(conversa, identidade)) {
          throw new ErroEntradaAtendimento("CONVERSA_INDISPONIVEL");
        }

        return {
          conversaId: conversa.id,
          duplicada: true,
          mensagemId: idempotenciaExistente.mensagem.id,
          status: "processando",
        };
      }

      let conversa = dados.conversaId
        ? await transacao.buscarConversa(dados.conversaId)
        : null;

      if (dados.conversaId) {
        if (
          !conversa ||
          conversa.status !== "ativa" ||
          !conversaPertenceAIdentidade(conversa, identidade)
        ) {
          throw new ErroEntradaAtendimento("CONVERSA_INDISPONIVEL");
        }
      } else {
        conversa = await transacao.criarConversa(identidade, dados.canal);
        await transacao.criarEstadoInicial(conversa.id);
      }

      if (!conversa) {
        throw new ErroEntradaAtendimento("PERSISTENCIA_INDISPONIVEL");
      }

      // A mensagem nasce em "recebida" antes de qualquer etapa posterior.
      const mensagem = await transacao.criarMensagemRecebida({
        chaveIdempotencia: criarChavePersistidaMensagem(
          escopo,
          dados.chaveIdempotencia,
        ),
        conteudo: dados.mensagem,
        conversaId: conversa.id,
        identificadorCanal: dados.chaveIdempotencia,
      });

      await transacao.criarIdempotencia({
        chave: dados.chaveIdempotencia,
        conversaId: conversa.id,
        escopo,
        expiraEm: new Date(Date.now() + DURACAO_IDEMPOTENCIA_ENTRADA_EM_MS),
        hashRequisicao,
        mensagemId: mensagem.id,
      });

      validarTransicaoEntradaMensagem("recebida", "validando");
      await transacao.atualizarEstadoMensagem(mensagem.id, "validando");

      validarTransicaoEntradaMensagem("validando", "processando");
      await transacao.atualizarEstadoMensagem(mensagem.id, "processando");

      await transacao.atualizarAtividadeConversa(conversa.id);
      await transacao.registrarAuditoriaEntrada({
        conversaId: conversa.id,
        identificadorAtor:
          identidade.usuarioId ?? identidade.identificadorSessao,
        mensagemId: mensagem.id,
        tipoAtor: identidade.usuarioId ? "cliente_autenticado" : "visitante",
      });
      await transacao.concluirIdempotencia(
        escopo,
        dados.chaveIdempotencia,
        mensagem.id,
      );

      return {
        conversaId: conversa.id,
        duplicada: false,
        mensagemId: mensagem.id,
        status: "processando",
      };
    });
  } catch (erro) {
    if (erro instanceof ErroEntradaAtendimento) throw erro;
    throw new ErroEntradaAtendimento("PERSISTENCIA_INDISPONIVEL");
  }
}
