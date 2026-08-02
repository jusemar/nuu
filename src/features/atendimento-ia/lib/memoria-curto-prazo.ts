import { CATEGORIAS_MEMORIA_AUTORIZADAS } from "../constants/contexto";

export type CategoriaMemoria = (typeof CATEGORIAS_MEMORIA_AUTORIZADAS)[number];

export type MemoriaCurtoPrazo = {
  assuntoNormalizado: string;
  autorizacaoAtiva: boolean;
  categoria: CategoriaMemoria;
  expiraEm: Date;
  necessidadeEncerrada: boolean;
  origem: "informada_cliente" | "confirmada_sistema";
  proprietarioId: string;
  removidaEm: Date | null;
  restrita: boolean;
  sensibilidade: "comercial" | "restrita";
  situacao: "ativa" | "substituida" | "contraditoria";
  ultimaUtilizacaoValidaEm: Date;
  valorEstruturado: Record<string, unknown>;
};

export function normalizarAssuntoMemoria(assunto: string) {
  return assunto
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function memoriaPodeSerUtilizada(
  memoria: MemoriaCurtoPrazo,
  dados: { agora: Date; memoriaAtiva: boolean; usuarioId: string | null },
) {
  return Boolean(
    dados.memoriaAtiva &&
      dados.usuarioId &&
      memoria.proprietarioId === dados.usuarioId &&
      memoria.autorizacaoAtiva &&
      memoria.situacao === "ativa" &&
      !memoria.removidaEm &&
      !memoria.restrita &&
      memoria.sensibilidade === "comercial" &&
      CATEGORIAS_MEMORIA_AUTORIZADAS.includes(memoria.categoria) &&
      memoria.expiraEm > dados.agora &&
      ["informada_cliente", "confirmada_sistema"].includes(memoria.origem),
  );
}

export function renovarMemoriaAposUsoValido(
  memoria: MemoriaCurtoPrazo,
  dados: { agora: Date; dias: number },
) {
  if (memoria.necessidadeEncerrada) return memoria;
  return {
    ...memoria,
    expiraEm: new Date(dados.agora.getTime() + dados.dias * 86_400_000),
    ultimaUtilizacaoValidaEm: dados.agora,
  };
}

export function compararMemoria(
  existente: MemoriaCurtoPrazo,
  candidata: Pick<
    MemoriaCurtoPrazo,
    "assuntoNormalizado" | "categoria" | "valorEstruturado"
  > & { correcaoExplicita: boolean },
) {
  const mesmaChave =
    existente.categoria === candidata.categoria &&
    existente.assuntoNormalizado === candidata.assuntoNormalizado;
  if (!mesmaChave) return "nova" as const;
  if (
    JSON.stringify(existente.valorEstruturado) ===
    JSON.stringify(candidata.valorEstruturado)
  ) {
    return "duplicada" as const;
  }
  const entradasExistentes = Object.entries(existente.valorEstruturado);
  const semConflito = entradasExistentes.every(
    ([chave, valor]) =>
      !(chave in candidata.valorEstruturado) ||
      JSON.stringify(candidata.valorEstruturado[chave]) === JSON.stringify(valor),
  );
  if (semConflito) return "complementar" as const;
  return candidata.correcaoExplicita
    ? ("substituir" as const)
    : ("contradicao" as const);
}

export function removerMemoria(memoria: MemoriaCurtoPrazo, agora: Date) {
  return { ...memoria, removidaEm: agora, situacao: "substituida" as const };
}
