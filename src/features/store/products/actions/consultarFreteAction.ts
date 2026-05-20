"use server";

import { fetchAddressByCep } from "@/features/admin/logistics/entrega-propria/services/viaCepService";
import { getProductOwnDeliveryPrice } from "@/features/admin/logistics/entrega-propria/services/shippingService";
import { registrarBairroPendenteEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions";
import { salvarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/actions/shipping-zip-addresses.actions";
import {
  mapShippingZipAddressToEnderecoCep,
  mapViaCepToEnderecoCep,
} from "@/features/admin/logistics/entrega-propria/lib/shipping-zip-address-mapper";
import { buscarEnderecoCepEntregaPropria } from "@/features/admin/logistics/entrega-propria/queries/shipping-zip-addresses.queries";

export interface ConsultaFreteSucesso {
  found: true;
  shippingPrice: number;
  level: "cep-especifico" | "regiao" | "bairro-avulso";
  message: string;
  bairro: string;
  cidade: string;
  uf: string;
  endereco: EnderecoFreteConsultado;
}

export interface ConsultaFreteFalha {
  found: false;
  message: string;
  endereco?: EnderecoFreteConsultado;
}

export type ConsultaFreteResult = ConsultaFreteSucesso | ConsultaFreteFalha;

export type EnderecoFreteConsultado = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export async function consultarFreteAction(
  productId: string,
  cep: string,
): Promise<ConsultaFreteResult> {
  const cleanCep = cep.replace(/\D/g, "");

  console.info("[frete][server-start]", {
    productId,
    cepRecebido: cep,
    cleanCep,
  });

  if (!productId) {
    return { found: false, message: "Consulte o vendedor" };
  }

  if (cleanCep.length !== 8) {
    return { found: false, message: "CEP inválido" };
  }

  let enderecoLocal: Awaited<
    ReturnType<typeof buscarEnderecoCepEntregaPropria>
  > = null;

  try {
    enderecoLocal = await buscarEnderecoCepEntregaPropria(cleanCep);
  } catch (error) {
    console.error("[frete][server-zip-cache-read-error]", {
      productId,
      cleanCep,
      error,
    });
  }
  let endereco = enderecoLocal
    ? mapShippingZipAddressToEnderecoCep(enderecoLocal)
    : null;
  let enderecoSource = enderecoLocal ? "local-db" : "external";

  if (!endereco) {
    const enderecoExterno = await fetchAddressByCep(cleanCep);
    endereco = enderecoExterno
      ? mapViaCepToEnderecoCep(enderecoExterno, "external")
      : null;

    if (endereco) {
      enderecoSource = endereco.source;

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
      } catch (error) {
        console.error("[frete][server-zip-cache-save-error]", {
          productId,
          cleanCep,
          error,
        });
      }
    }
  }

  console.info("[frete][server-viacep]", {
    productId,
    cleanCep,
    enderecoSource,
    endereco,
  });

  if (!endereco || !endereco.bairro) {
    return {
      found: false,
      message: "Consulte o vendedor",
    };
  }

  const bairro = endereco.bairro;
  const cidade = endereco.localidade || "";
  const uf = endereco.uf || "";
  const enderecoConsultado: EnderecoFreteConsultado = {
    cep: cleanCep,
    logradouro: endereco.logradouro || "",
    bairro,
    cidade,
    uf,
  };

  let result: Awaited<ReturnType<typeof getProductOwnDeliveryPrice>>;

  try {
    result = await getProductOwnDeliveryPrice(
      productId,
      cleanCep,
      bairro,
      cidade,
      uf,
    );
  } catch (error) {
    console.error("[frete][server-price-error]", {
      productId,
      cleanCep,
      bairro,
      cidade,
      uf,
      error,
    });

    return {
      found: false,
      message: "Consulte o vendedor",
      endereco: enderecoConsultado,
    };
  }

  console.info("[frete][server-result]", {
    productId,
    cleanCep,
    bairro,
    cidade,
    uf,
    result,
  });

  if (!result.found && result.pendingEligible) {
    try {
      await registrarBairroPendenteEntregaPropria({
        cep: cleanCep,
        neighborhood: bairro,
        city: cidade,
        state: uf,
      });
    } catch (error) {
      console.error("[frete][server-pending-error]", {
        productId,
        cleanCep,
        bairro,
        cidade,
        uf,
        error,
      });
    }
  }

  if (!result.found) {
    return {
      found: false,
      message: result.message,
      endereco: enderecoConsultado,
    };
  }

  return {
    found: true,
    shippingPrice: result.shippingPrice,
    level: result.level,
    message: result.message,
    bairro,
    cidade,
    uf,
    endereco: enderecoConsultado,
  };
}
