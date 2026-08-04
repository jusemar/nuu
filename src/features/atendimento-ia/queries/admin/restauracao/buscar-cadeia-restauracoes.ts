import "server-only";

import { buscarVersaoHistoricaSchema } from "../../../schemas/admin/restauracao.schema";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { buscarVersaoHistoricaAdmin } from "./buscar-versao-historica";

export async function buscarCadeiaRestauracoesAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const dados = buscarVersaoHistoricaSchema.parse(entrada);
  const cadeia: Array<{
    estado: string;
    hash: string;
    id: string;
    numero: number;
    restauradaDeVersaoId: string | null;
  }> = [];
  const visitados = new Set<string>();
  let versaoId: string | null = dados.versaoId;
  while (versaoId && cadeia.length < 100 && !visitados.has(versaoId)) {
    visitados.add(versaoId);
    const item = await buscarVersaoHistoricaAdmin({ ...dados, versaoId });
    if (!item) break;
    cadeia.push({
      estado: item.estado,
      hash: item.hash,
      id: item.id,
      numero: item.numero,
      restauradaDeVersaoId: item.restauradaDeVersaoId,
    });
    versaoId = item.restauradaDeVersaoId;
  }
  return cadeia;
}
