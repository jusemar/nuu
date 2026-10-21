import type { ResultadoChamadaLaquila } from "../cliente-laquila";
import {
  atualizarSincronizacaoPedidoLaquila,
  interpretarConsultaPedidoLaquila,
  type SincronizacaoPedidoLaquila,
} from "./estado-pedido-laquila";

export type CandidatoReconciliacaoLaquila = {
  id: string;
  pedidoId: string;
  idPedidoExterno: string;
  fornecedorId: string;
};

export type DependenciasReconciliacaoLaquila = {
  listar(): Promise<CandidatoReconciliacaoLaquila[]>;
  adquirir(candidato: CandidatoReconciliacaoLaquila): Promise<{
    concessao: string;
    anterior: SincronizacaoPedidoLaquila | null;
  } | null>;
  consultar(
    candidato: CandidatoReconciliacaoLaquila,
  ): Promise<ResultadoChamadaLaquila>;
  persistir(
    candidato: CandidatoReconciliacaoLaquila,
    concessao: string,
    sincronizacao: SincronizacaoPedidoLaquila,
  ): Promise<boolean>;
  agora(): Date;
  segredos?: readonly string[];
};

/** O orquestrador não recebe uma porta de criação de pedido nem de pagamento. */
export async function reconciliarPedidosLaquila(
  dependencias: DependenciasReconciliacaoLaquila,
) {
  const resultado = {
    selecionados: 0,
    consultados: 0,
    sincronizados: 0,
    falhas: 0,
  };
  const candidatos = await dependencias.listar();
  resultado.selecionados = candidatos.length;
  for (const candidato of candidatos) {
    const adquirido = await dependencias.adquirir(candidato);
    if (!adquirido) continue;
    let resposta: ResultadoChamadaLaquila;
    try {
      resposta = await dependencias.consultar(candidato);
    } catch {
      resposta = {
        sucesso: false,
        codigoHttp: null,
        erro: "Falha temporária na consulta externa.",
      };
    }
    resultado.consultados += 1;
    const consulta = interpretarConsultaPedidoLaquila(
      resposta,
      candidato.idPedidoExterno,
      dependencias.segredos,
    );
    if (consulta.erro) resultado.falhas += 1;
    const sincronizacao = atualizarSincronizacaoPedidoLaquila({
      anterior: adquirido.anterior,
      consulta,
      agora: dependencias.agora(),
    });
    if (
      await dependencias.persistir(
        candidato,
        adquirido.concessao,
        sincronizacao,
      )
    )
      resultado.sincronizados += 1;
  }
  return resultado;
}
