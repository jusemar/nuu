import type {
  ElegibilidadePublicacao,
  EntradaElegibilidadePublicacao,
  StatusElegibilidadePublicacao,
} from "../../../types/admin/publicacao";
import { calcularIdentidadeCandidato } from "./calcular-identidade-candidato";
import { consolidarBloqueios } from "./consolidar-bloqueios";
import { aplicarPoliticaAlertas } from "./politica-alertas-publicacao";
import { validarCasosObrigatorios } from "./validar-casos-obrigatorios";
import { validarHashAprovado } from "./validar-hash-aprovado";
import { validarResultadosLaboratorio } from "./validar-resultados-laboratorio";
import { validarRevisoesPublicacao } from "./validar-revisoes-publicacao";
export function avaliarElegibilidadePublicacao(
  entrada: EntradaElegibilidadePublicacao,
  agora = new Date(),
): ElegibilidadePublicacao {
  const revisao = validarRevisoesPublicacao(entrada.revisao);
  const hash = validarHashAprovado(entrada.hashAtual, entrada.revisao);
  const laboratorio = validarResultadosLaboratorio(
    entrada.resultados,
    entrada.hashAtual,
  );
  const casos = validarCasosObrigatorios(
    entrada.casosObrigatorios,
    entrada.resultados,
  );
  const bloqueios = consolidarBloqueios(revisao, hash, laboratorio, casos);
  const temRevisao = entrada.revisao.estado === "aprovada";
  const temTesteValido = entrada.resultados.some(
    (r) =>
      r.status === "concluida" &&
      Object.values(r.hashesCongelados).includes(entrada.hashAtual),
  );
  let status: StatusElegibilidadePublicacao = "elegivel";
  if (
    bloqueios.some((b) =>
      [
        "hash_aprovado_divergente",
        "resultado_laboratorio_obsoleto",
        "versao_modificada_apos_aprovacao",
      ].includes(b),
    )
  )
    status = "obsoleto";
  else if (!temRevisao) status = "aguardando_revisao";
  else if (!temTesteValido || casos.length) status = "aguardando_testes";
  else if (bloqueios.length) status = "bloqueado";
  const alertas = aplicarPoliticaAlertas(entrada.alertasDetectados);
  return {
    tipo: entrada.tipo,
    candidatoId: entrada.candidatoId,
    identidadeCandidato: calcularIdentidadeCandidato(entrada),
    hashAvaliado: entrada.hashAtual,
    status,
    elegivel: status === "elegivel",
    bloqueios,
    ...alertas,
    revisaoConsiderada: entrada.revisao,
    execucoesConsideradas: [
      ...new Set(entrada.resultados.map((r) => r.execucaoId)),
    ],
    casosObrigatorios: entrada.casosObrigatorios
      .filter(
        (c) =>
          c.obrigatorio || c.bloqueiaPublicacao || c.criticidade === "critica",
      )
      .map((c) => c.id),
    avaliadoEm: agora,
  };
}
