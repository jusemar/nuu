"use server";

import { registrarBairroPendenteEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions";
import { salvarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/shipping-zip-addresses.actions";
import {
  mapShippingZipAddressToEnderecoCep,
  mapViaCepToEnderecoCep,
} from "@/features/admin/logistics/entrega-propria/lib/shipping-zip-address-mapper";
import { buscarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/queries/shipping-zip-addresses.queries";
import {
  getProductOwnDeliveryPrice,
  getProductsOwnDeliveryForecasts,
} from "@/features/admin/logistics/entrega-propria/services/shippingService";
import { fetchAddressByCep } from "@/features/admin/logistics/entrega-propria/services/viaCepService";
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
      valorEmCentavos: number;
      nivel: "cep-especifico" | "regiao" | "bairro-avulso";
      descricao: string;
      prazoEntrega?: string | null;
      promessaEntrega?: PromessaEntregaPropria | null;
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

  let resultado: Awaited<ReturnType<typeof getProductOwnDeliveryPrice>>;

  try {
    resultado = await getProductOwnDeliveryPrice(
      produtoId,
      cepLimpo,
      bairro,
      cidade,
      uf,
    );
  } catch {
    return {
      disponivel: false,
      mensagem: "Consulte o vendedor",
      endereco: enderecoConsultado,
    };
  }

  if (!resultado.found && resultado.pendingEligible && registrarPendente) {
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

  if (!resultado.found) {
    return {
      disponivel: false,
      mensagem: resultado.message,
      endereco: enderecoConsultado,
    };
  }

  return {
    disponivel: true,
    valorEmCentavos: resultado.shippingPrice,
    nivel: resultado.level,
    descricao: resultado.message,
    prazoEntrega: resultado.deliveryDeadline ?? null,
    promessaEntrega: resultado.promessaEntrega ?? null,
    regiaoResolvida: resultado.region
      ? {
          id: resultado.region.id,
          nome: resultado.region.name,
          cidade: resultado.region.city,
          estado: resultado.region.state,
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

  return getProductsOwnDeliveryForecasts(
    idsUnicos,
    cepLimpo,
    endereco.bairro,
    endereco.localidade || "",
    endereco.uf || "",
  );
}
