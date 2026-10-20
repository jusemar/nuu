import { z } from "zod";

const custoInteiro = z.number().int().positive().max(2_147_483_647);

/** Aceita o texto do formulário e números de outros chamadores, sem arredondar. */
export const custoPontosRecompensaProdutoSchema = z.union([
  z.string().trim().regex(/^\d+$/).transform(Number).pipe(custoInteiro),
  custoInteiro,
]);

const ativoSchema = z.boolean();

type ConfiguracaoAnterior = {
  recompensaPontosAtiva: boolean;
  recompensaCustoPontos: number | null;
};

type EntradaConfiguracao = {
  recompensaPontosAtiva?: unknown;
  recompensaCustoPontos?: unknown;
};

/** O servidor revalida a opção e o custo antes de gravar as colunas da migration 0057. */
export function validarConfiguracaoRecompensaProduto(
  entrada: EntradaConfiguracao,
  anterior?: ConfiguracaoAnterior,
) {
  const ativo = ativoSchema.safeParse(
    entrada.recompensaPontosAtiva === undefined
      ? (anterior?.recompensaPontosAtiva ?? false)
      : entrada.recompensaPontosAtiva,
  );
  if (!ativo.success) {
    return { sucesso: false as const, erro: "Disponibilidade da recompensa inválida." };
  }
  if (!ativo.data) {
    // A elegibilidade fica desligada; o custo anterior continua configurado para reativação.
    return {
      sucesso: true as const,
      recompensaPontosAtiva: false,
      recompensaCustoPontos: anterior?.recompensaCustoPontos ?? null,
    };
  }
  const custoRecebido = entrada.recompensaCustoPontos === undefined
    ? anterior?.recompensaCustoPontos
    : entrada.recompensaCustoPontos;
  const custo = custoPontosRecompensaProdutoSchema.safeParse(custoRecebido);
  if (!custo.success) {
    return {
      sucesso: false as const,
      erro: "Informe um custo em pontos inteiro e maior que zero.",
    };
  }
  return {
    sucesso: true as const,
    recompensaPontosAtiva: true,
    recompensaCustoPontos: custo.data,
  };
}
