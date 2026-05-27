"use server";

import { db } from "@/db/connection";
import {
  provedoresFreteTable,
  servicosFreteTable,
  transportadorasFreteTable,
} from "@/db/schema";
import { mapearCatalogoFrenet } from "@/features/admin/logistica/lib/mapear-catalogo-frenet";
import type { RespostaAcaoAdminFrete } from "@/features/admin/logistica/types/frete-admin.types";
import { consultarCotacaoFrenet } from "@/features/logistica/lib/provedores/frenet/consultar-cotacao-frenet";
import { obterConfiguracaoFrenet } from "@/features/logistica/lib/provedores/frenet/obter-configuracao-frenet";
import type { SolicitacaoCotacaoFrete } from "@/features/logistica/types/contratos-frete";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const sincronizarCatalogoFrenetSchema = z.object({
  cepDestino: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .pipe(z.string().length(8, "Informe um CEP de destino válido")),
  pesoEmKg: z.coerce.number().positive("Peso deve ser maior que zero"),
  alturaEmCm: z.coerce
    .number()
    .int()
    .positive("Altura deve ser maior que zero"),
  larguraEmCm: z.coerce
    .number()
    .int()
    .positive("Largura deve ser maior que zero"),
  comprimentoEmCm: z.coerce
    .number()
    .int()
    .positive("Comprimento deve ser maior que zero"),
});

export async function sincronizarCatalogoFrenet(
  entrada: unknown,
): Promise<
  RespostaAcaoAdminFrete<{ transportadoras: number; servicos: number }>
> {
  const validacao = sincronizarCatalogoFrenetSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  const configuracao = obterConfiguracaoFrenet();
  if (!configuracao) {
    return {
      sucesso: false,
      erro: "Configure token, CEP de origem e habilitação da Frenet antes de sincronizar.",
    };
  }

  const [provedorFrenet] = await db
    .select({
      id: provedoresFreteTable.id,
      ativo: provedoresFreteTable.ativo,
    })
    .from(provedoresFreteTable)
    .where(eq(provedoresFreteTable.identificador, "frenet"));

  if (!provedorFrenet?.ativo) {
    return {
      sucesso: false,
      erro: "Ative a Frenet antes de sincronizar transportadoras e serviços.",
    };
  }

  const dados = validacao.data;
  const solicitacao: SolicitacaoCotacaoFrete = {
    identificador: `catalogo-frenet-${Date.now()}`,
    destino: { cep: dados.cepDestino, pais: "BR" },
    itens: [
      {
        identificador: "item-catalogo-frenet",
        produtoId: "catalogo-frenet",
        nome: "Consulta de catálogo Frenet",
        quantidade: 1,
        pesoEmGramas: Math.round(dados.pesoEmKg * 1000),
        dimensoes: {
          alturaEmCm: dados.alturaEmCm,
          larguraEmCm: dados.larguraEmCm,
          comprimentoEmCm: dados.comprimentoEmCm,
        },
      },
    ],
    pacotes: [],
    moeda: "BRL",
  };

  try {
    const resultado = await consultarCotacaoFrenet(solicitacao, configuracao);
    const catalogo = mapearCatalogoFrenet(resultado.opcoes);

    if (catalogo.servicos.length === 0) {
      return {
        sucesso: false,
        erro: "A Frenet não retornou serviços para o CEP e pacote informados.",
      };
    }

    const idsTransportadoras = new Map<string, string>();
    for (const transportadora of catalogo.transportadoras) {
      const [registro] = await db
        .insert(transportadorasFreteTable)
        .values({
          provedorFreteId: provedorFrenet.id,
          identificador: transportadora.identificador,
          nome: transportadora.nome,
          ativo: true,
        })
        .onConflictDoUpdate({
          target: [
            transportadorasFreteTable.provedorFreteId,
            transportadorasFreteTable.identificador,
          ],
          set: { nome: transportadora.nome, updatedAt: new Date() },
        })
        .returning({ id: transportadorasFreteTable.id });

      if (registro)
        idsTransportadoras.set(transportadora.identificador, registro.id);
    }

    for (const servico of catalogo.servicos) {
      const transportadoraFreteId = idsTransportadoras.get(
        servico.transportadoraIdentificador,
      );
      if (!transportadoraFreteId) continue;

      await db
        .insert(servicosFreteTable)
        .values({
          provedorFreteId: provedorFrenet.id,
          transportadoraFreteId,
          identificador: servico.identificador,
          nome: servico.nome,
          ativo: true,
        })
        .onConflictDoUpdate({
          target: [
            servicosFreteTable.provedorFreteId,
            servicosFreteTable.identificador,
          ],
          set: {
            transportadoraFreteId,
            nome: servico.nome,
            updatedAt: new Date(),
          },
        });
    }

    revalidatePath("/admin/logistica/integracoes");
    revalidatePath("/admin/logistica/transportadoras-integracoes");
    revalidatePath("/admin/logistica/servicos-entrega");

    return {
      sucesso: true,
      dados: {
        transportadoras: catalogo.transportadoras.length,
        servicos: catalogo.servicos.length,
      },
    };
  } catch {
    return {
      sucesso: false,
      erro: "Não foi possível consultar a Frenet para sincronizar o catálogo.",
    };
  }
}
