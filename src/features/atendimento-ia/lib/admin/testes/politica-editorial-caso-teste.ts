import { validarAnonimizacaoIrreversivel } from "./validar-anonimizacao-irreversivel";
import { validarDadosFicticios } from "./validar-dados-ficticios";
import { validarEfeitoRealProibido } from "./validar-efeito-real-proibido";

export function validarPoliticaEditorialCasoTeste(dados: {
  dadosOrigem: "ficticio" | "snapshot_anonimizado";
  efeitosEsperados: string;
  ferramentasPermitidas: string[];
  [chave: string]: unknown;
}) {
  validarEfeitoRealProibido(dados);
  if (dados.dadosOrigem === "ficticio") validarDadosFicticios(dados);
  else validarAnonimizacaoIrreversivel(dados);
  return true;
}
