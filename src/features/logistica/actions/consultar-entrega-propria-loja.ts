"use server";

import { registrarBairroPendenteEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions";
import { salvarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/shipping-zip-addresses.actions";
import {
  mapShippingZipAddressToEnderecoCep,
  mapViaCepToEnderecoCep,
} from "@/features/admin/logistics/entrega-propria/lib/shipping-zip-address-mapper";
import { buscarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/queries/shipping-zip-addresses.queries";
import { fetchAddressByCep } from "@/features/admin/logistics/entrega-propria/services/viaCepService";
import {
  resolverEntregaPropriaProduto,
  resolverPrevisoesEntregaPropriaProdutos,
} from "@/features/logistica/queries/resolver-entrega-propria";

import type { PromessaEntregaProgramada } from "../lib/entrega-propria/calcular-promessa-entrega-programada";
import type { PromessaEntregaPropria } from "../lib/entrega-propria/calcular-promessa-entrega-propria";

export type EnderecoEntregaPropriaLoja = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type ResultadoConsultaEntregaPropriaLoja =
  | {
      disponivel: true;
      entregaRapidaAtiva?: boolean;
      valorEmCentavos: number;
      nivel: "cep-especifico" | "regiao" | "bairro" | "cidade";
      descricao: string;
      prazoEntrega?: string | null;
      promessaEntrega?: PromessaEntregaPropria | null;
      entregaProgramada?: {
        valorEmCentavos: number;
        promessa: PromessaEntregaProgramada;
      } | null;
      regiaoResolvida?: {
        id: number;
        nome: string;
        cidade: string;
        estado: string;
      } | null;
      bairro: string;
      cidade: string;
      uf: string;
      endereco: EnderecoEntregaPropriaLoja;
    }
  | {
      disponivel: false;
      mensagem: string;
      endereco?: EnderecoEntregaPropriaLoja;
    };

async function buscarEnderecoEntregaPropriaLoja(cepLimpo: string) {
  let enderecoLocal: Awaited<
    ReturnType<typeof buscarEnderecoCepEntregaPropria>
  > = null;

  try {
    enderecoLocal = await buscarEnderecoCepEntregaPropria(cepLimpo);
  } catch {
    // A consulta externa cobre indisponibilidade do cache de CEP.
  }

  const enderecoPersistido = enderecoLocal
    ? mapShippingZipAddressToEnderecoCep(enderecoLocal)
    : null;

  if (enderecoPersistido) {
    return enderecoPersistido;
  }

  const enderecoExterno = await fetchAddressByCep(cepLimpo);
  const endereco = enderecoExterno
    ? mapViaCepToEnderecoCep(enderecoExterno, "external")
    : null;

  if (endereco) {
    try {
      await salvarEnderecoCepEntregaPropria({
        cep: endereco.cep,
        street: endereco.logradouro,
        complement: endereco.complemento || null,
        neighborhood: endereco.bairro,
        city: endereco.localidade,
        state: endereco.uf,
        ibgeCode: endereco.ibge || null,
        source: endereco.source,
      });
    } catch {
      // Cache de CEP nao pode bloquear a cotacao oficial.
    }
  }

  return endereco;
}

async function consultarProdutoNoEndereco({
  produtoId,
  cepLimpo,
  endereco,
  registrarPendente,
}: {
  produtoId: string;
  cepLimpo: string;
  endereco: NonNullable<
    Awaited<ReturnType<typeof buscarEnderecoEntregaPropriaLoja>>
  >;
  registrarPendente: boolean;
}): Promise<ResultadoConsultaEntregaPropriaLoja> {
  const bairro = endereco.bairro;
  const cidade = endereco.localidade || "";
  const uf = endereco.uf || "";
  const enderecoConsultado = {
    cep: cepLimpo,
    logradouro: endereco.logradouro || "",
    bairro,
    cidade,
    uf,
  };

  let resultado: Awaited<ReturnType<typeof resolverEntregaPropriaProduto>>;
  try {
    resultado = await resolverEntregaPropriaProduto({
      produtoId,
      endereco: { cep: cepLimpo, bairro, cidade, uf },
    });
  } catch {
    return {
      disponivel: false,
      mensagem: "Consulte o vendedor",
      endereco: enderecoConsultado,
    };
  }

  if (
    !resultado.encontrado &&
    resultado.pendenciaElegivel &&
    registrarPendente
  ) {
    try {
      await registrarBairroPendenteEntregaPropria({
        cep: cepLimpo,
        neighborhood: bairro,
        city: cidade,
        state: uf,
      });
    } catch {
      // Pendencia operacional nao bloqueia a cotacao.
    }
  }

  if (!resultado.encontrado) {
    return {
      disponivel: false,
      mensagem: resultado.motivo,
      endereco: enderecoConsultado,
    };
  }

  return {
    disponivel: true,
    entregaRapidaAtiva: resultado.entregaRapidaAtiva,
    valorEmCentavos: resultado.valorRapidaEmCentavos ?? 0,
    nivel:
      resultado.nivelPreco === "cep" ? "cep-especifico" : resultado.nivelPreco,
    descricao: resultado.promessaRapida?.texto ?? "Entrega própria configurada",
    prazoEntrega:
      resultado.promessaRapida?.texto ?? resultado.prazoOpcional ?? null,
    promessaEntrega: resultado.promessaRapida,
    entregaProgramada: resultado.entregaProgramada,
    regiaoResolvida: resultado.regiao
      ? {
          id: resultado.regiao.id,
          nome: resultado.regiao.nome,
          cidade: resultado.regiao.cidade,
          estado: resultado.regiao.estado,
        }
      : null,
    bairro,
    cidade,
    uf,
    endereco: enderecoConsultado,
  };
}

export async function consultarEntregaPropriaLoja({
  produtoId,
  cep,
}: {
  produtoId: string;
  cep: string;
}): Promise<ResultadoConsultaEntregaPropriaLoja> {
  const cepLimpo = cep.replace(/\D/g, "");

  if (!produtoId || cepLimpo.length !== 8) {
    return {
      disponivel: false,
      mensagem: cepLimpo.length !== 8 ? "CEP inválido" : "Consulte o vendedor",
    };
  }

  const endereco = await buscarEnderecoEntregaPropriaLoja(cepLimpo);
  if (!endereco?.bairro) {
    return { disponivel: false, mensagem: "Consulte o vendedor" };
  }

  return consultarProdutoNoEndereco({
    produtoId,
    cepLimpo,
    endereco,
    registrarPendente: true,
  });
}

export async function consultarPrevisoesEntregaPropriaProdutosLoja({
  produtosIds,
  cep,
}: {
  produtosIds: string[];
  cep: string;
}) {
  const cepLimpo = cep.replace(/\D/g, "");
  const idsUnicos = [...new Set(produtosIds.filter(Boolean))].slice(0, 80);
  if (cepLimpo.length !== 8 || idsUnicos.length === 0) return {};

  // O endereço é resolvido uma única vez para todo o lote. Cada produto ainda
  // passa pela mesma validação oficial de preço, cobertura, modalidade e agenda.
  const endereco = await buscarEnderecoEntregaPropriaLoja(cepLimpo);
  if (!endereco?.bairro) return {};

  return resolverPrevisoesEntregaPropriaProdutos({
    produtosIds: idsUnicos,
    endereco: {
      cep: cepLimpo,
      bairro: endereco.bairro,
      cidade: endereco.localidade || "",
      uf: endereco.uf || "",
    },
  });
}
