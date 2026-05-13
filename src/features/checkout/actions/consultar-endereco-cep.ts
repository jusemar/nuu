"use server";

const VIA_CEP_URL = "https://viacep.com.br/ws";

type ViaCepCheckoutResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function consultarEnderecoCep(cep: string) {
  const cepLimpo = cep.replace(/\D/g, "");

  if (cepLimpo.length !== 8) {
    return {
      encontrado: false,
      mensagem: "CEP inválido",
    };
  }

  try {
    const response = await fetch(`${VIA_CEP_URL}/${cepLimpo}/json/`);

    if (!response.ok) {
      return {
        encontrado: false,
        mensagem: "Não foi possível consultar o CEP",
      };
    }

    const endereco = (await response.json()) as ViaCepCheckoutResponse;

    if (endereco.erro) {
      return {
        encontrado: false,
        mensagem: "CEP não encontrado",
      };
    }

    return {
      encontrado: true,
      endereco: {
        cep: endereco.cep,
        rua: endereco.logradouro,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.localidade,
        estado: endereco.uf,
      },
    };
  } catch {
    return {
      encontrado: false,
      mensagem: "Erro ao consultar o CEP",
    };
  }
}
