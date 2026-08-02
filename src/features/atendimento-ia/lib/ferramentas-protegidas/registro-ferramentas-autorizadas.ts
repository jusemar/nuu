import type { FerramentaProtegida, NivelProtecaoFerramenta } from "../../types/ferramentas-protegidas";
import type { FerramentaPublica, NomeFerramentaPublica } from "../../types/ferramentas-publicas";

export type EntradaRegistroFerramenta = {
  dadosMinimosPermitidos: readonly string[];
  definicao: FerramentaPublica["definicao"];
  finalidade: string;
  habilitada: boolean;
  handlerAutorizado: boolean;
  id: string;
  nivel: NivelProtecaoFerramenta;
  politicaConfirmacao: "nao_aplicavel" | "obrigatoria";
  politicaIdempotencia: "por_consulta" | "obrigatoria" | "bloqueada";
  schemaArgumentos: FerramentaPublica["schemaArgumentos"];
  schemaResultado: FerramentaPublica["schemaResultado"];
  versao: string;
};

/** Registro único; nada fora deste mapa pode ser anunciado ou executado. */
export function criarRegistroFerramentasAutorizadas(dados: {
  protegidas: Map<string, FerramentaProtegida>;
  publicas: Map<NomeFerramentaPublica, FerramentaPublica>;
}) {
  const registro = new Map<string, EntradaRegistroFerramenta>();
  for (const ferramenta of dados.publicas.values()) {
    registro.set(ferramenta.definicao.name, {
      dadosMinimosPermitidos: [],
      definicao: ferramenta.definicao,
      finalidade: ferramenta.definicao.description,
      habilitada: true,
      handlerAutorizado: true,
      id: ferramenta.definicao.name,
      nivel: "publica",
      politicaConfirmacao: "nao_aplicavel",
      politicaIdempotencia: "por_consulta",
      schemaArgumentos: ferramenta.schemaArgumentos,
      schemaResultado: ferramenta.schemaResultado,
      versao: ferramenta.versao,
    });
  }
  for (const ferramenta of dados.protegidas.values()) {
    if (registro.has(ferramenta.id)) throw new Error("FERRAMENTA_DUPLICADA_NO_REGISTRO");
    registro.set(ferramenta.id, {
      dadosMinimosPermitidos: ferramenta.dadosMinimosPermitidos,
      definicao: ferramenta.definicao,
      finalidade: ferramenta.finalidade,
      habilitada: ferramenta.habilitada,
      handlerAutorizado: Boolean(ferramenta.handler),
      id: ferramenta.id,
      nivel: ferramenta.nivel,
      politicaConfirmacao: ferramenta.politicaConfirmacao,
      politicaIdempotencia: ferramenta.politicaIdempotencia,
      schemaArgumentos: ferramenta.schemaArgumentos,
      schemaResultado: ferramenta.schemaResultado,
      versao: ferramenta.versao,
    });
  }
  return registro;
}
