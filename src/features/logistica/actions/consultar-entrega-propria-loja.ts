"use server";

import { registrarBairroPendenteEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions";
import { salvarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/shipping-zip-addresses.actions";
import {
  mapShippingZipAddressToEnderecoCep,
  mapViaCepToEnderecoCep,
} from "@/features/admin/logistics/entrega-propria/lib/shipping-zip-address-mapper";
import { buscarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/queries/shipping-zip-addresses.queries";
import { getProductOwnDeliveryPrice } from "@/features/admin/logistics/entrega-propria/services/shippingService";
import { fetchAddressByCep } from "@/features/admin/logistics/entrega-propria/services/viaCepService";

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

  if (!endereco || !endereco.bairro) {
    return {
      disponivel: false,
      mensagem: "Consulte o vendedor",
    };
  }

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

  if (!resultado.found && resultado.pendingEligible) {
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
    bairro,
    cidade,
    uf,
    endereco: enderecoConsultado,
  };
}
