import "server-only";

import { eq } from "drizzle-orm";

import {
  carteirasFidelidadeTable,
  checkoutClientesTable,
  configuracoesProgramaFidelidadeTable,
  productTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { calcularFreteRecompensa } from "@/features/programa-fidelidade/lib/calcular-frete-recompensa";
import type { EntradaPreviaRecompensa } from "@/features/programa-fidelidade/schemas/previa-recompensa.schema";
import { previaRecompensaSchema } from "@/features/programa-fidelidade/schemas/previa-recompensa.schema";

export type PreviaRecompensa = {
  produtoId: string;
  nome: string;
  imagemUrl: string | null;
  quantidade: 1;
  custoPontos: number;
  saldoDisponivel: number;
  saldoAposResgate: number | null;
  pontosFaltantes: number;
  podeResgatar: boolean;
  cepEntrega: string;
  entrega: Array<{ nome: string; tipo: "entrega" | "retirada"; prazo: string | null }>;
  freteEmCentavos: number;
  totalMonetarioEmCentavos: number;
};

/** Núcleo testável fora de uma requisição Next; só faz leituras. */
export async function calcularPreviaRecompensaInterno({
  entrada,
  usuarioId,
}: {
  entrada: EntradaPreviaRecompensa;
  usuarioId: string;
}): Promise<PreviaRecompensa> {
  const dados = previaRecompensaSchema.parse(entrada);
  const [configuracao, produto, cliente] = await Promise.all([
    dbTransacional.query.configuracoesProgramaFidelidadeTable.findFirst({
      where: eq(configuracoesProgramaFidelidadeTable.id, "global"),
    }),
    dbTransacional.query.productTable.findFirst({
      where: eq(productTable.id, dados.item.produtoId),
      with: { pricing: true, galleryImages: true, variants: true },
    }),
    dbTransacional.query.checkoutClientesTable.findFirst({
      where: eq(checkoutClientesTable.userId, usuarioId),
    }),
  ]);
  if (!configuracao?.ativo) throw new Error("PROGRAMA_FIDELIDADE_INATIVO");
  if (!produto?.recompensaPontosAtiva || !produto.recompensaCustoPontos ||
    !Number.isSafeInteger(produto.recompensaCustoPontos) || produto.recompensaCustoPontos <= 0
  ) throw new Error("PRODUTO_NAO_ELEGIVEL_RECOMPENSA");

  // O mesmo resolvedor da criação rejeita produto inativo, variante inválida e falta de estoque.
  const { freteFinal, freteValidado } = await calcularFreteRecompensa({
    item: dados.item,
    produto,
    entrega: dados,
  });
  const carteira = cliente
    ? await dbTransacional.query.carteirasFidelidadeTable.findFirst({
        where: eq(carteirasFidelidadeTable.clienteId, cliente.id),
      })
    : null;
  const saldoDisponivel = Number(carteira?.pontosDisponiveis ?? 0);
  const custoPontos = produto.recompensaCustoPontos;
  const podeResgatar = saldoDisponivel >= custoPontos;
  const imagem = produto.galleryImages.find((atual) => atual.isPrimary) ??
    produto.galleryImages[0];

  return {
    produtoId: produto.id,
    nome: produto.name,
    imagemUrl: imagem?.imageUrl ?? null,
    quantidade: 1,
    custoPontos,
    saldoDisponivel,
    saldoAposResgate: podeResgatar ? saldoDisponivel - custoPontos : null,
    pontosFaltantes: Math.max(0, custoPontos - saldoDisponivel),
    podeResgatar,
    cepEntrega: dados.cep.replace(/\D/g, ""),
    entrega: freteValidado.snapshot.grupos.map((grupo) => ({
      nome: grupo.entrega.servicoNome,
      tipo: grupo.entrega.tipo,
      prazo: null,
    })),
    freteEmCentavos: freteFinal,
    // O produto é quitado em pontos. Na V1, só o frete é monetário.
    totalMonetarioEmCentavos: freteFinal,
  };
}
