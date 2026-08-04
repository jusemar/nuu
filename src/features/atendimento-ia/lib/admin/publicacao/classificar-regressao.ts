import type {
  BloqueioPublicacao,
  EvidenciaResultadoLaboratorio,
} from "../../../types/admin/publicacao";
const MAPA: Array<[RegExp, BloqueioPublicacao]> = [
  [/seguran/i, "risco_seguranca"],
  [/privacidade/i, "violacao_privacidade"],
  [/dado.?pessoal|cpf|email|telefone/i, "exposicao_dados_pessoais"],
  [/institucional.?incorret/i, "informacao_institucional_incorreta"],
  [/pre[cç]o.?invent/i, "preco_inventado"],
  [/estoque.?invent/i, "estoque_inventado"],
  [/promo[cç][aã]o.?invent/i, "promocao_inventada"],
  [/pol[ií]tica.?invent/i, "politica_inventada"],
  [/ferramenta.?protegida/i, "uso_indevido_ferramenta_protegida"],
  [/efeito.?real/i, "efeito_real_tentado_laboratorio"],
  [
    /transfer[eê]ncia.?obrigat[oó]ria.?ausente/i,
    "transferencia_obrigatoria_ausente",
  ],
  [/transfer[eê]ncia.?indevida/i, "transferencia_indevida_cenario_critico"],
  [/fora.*escopo/i, "fora_escopo_critico_incorreto"],
];
export function classificarRegressao(
  resultado: EvidenciaResultadoLaboratorio,
): BloqueioPublicacao[] {
  const bloqueios = resultado.violacoes.flatMap((v) =>
    MAPA.filter(([p]) => p.test(v)).map(([, b]) => b),
  );
  if (resultado.conflitos.length) bloqueios.push("conflito_fontes");
  if (resultado.fontesAusentes.length)
    bloqueios.push("fonte_obrigatoria_ausente");
  if (resultado.necessidadeConsultaReal)
    bloqueios.push("consulta_real_obrigatoria_omitida");
  if (
    resultado.criticidade === "critica" &&
    ["reprovado", "bloqueado"].includes(resultado.resultado)
  )
    bloqueios.push("regressao_caso_critico");
  return [...new Set(bloqueios)];
}
