export type ParametrosComportamentoAdmin = {
  concisao: "curta" | "equilibrada" | "detalhada";
  formalidade: "informal_respeitosa" | "neutra" | "formal";
  tratamentoIncerteza:
    | "declarar_limite"
    | "consultar_fonte"
    | "transferir_quando_necessario";
};

export type BlocoEditavelComportamentoAdmin = {
  conteudo: string;
  identificador: string;
  titulo: string;
};

export type ComportamentoTomAdmin = {
  blocosEditaveis: BlocoEditavelComportamentoAdmin[];
  exemplosEvitar: string[];
  exemplosPositivos: string[];
  parametros: ParametrosComportamentoAdmin;
  resumoAlteracao: string;
  versaoNucleoProtegido: string;
};
