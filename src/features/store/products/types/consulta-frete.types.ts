export interface ConsultaFreteSucesso {
  found: true;
  shippingPrice: number;
  level: "cep-especifico" | "regiao" | "bairro-avulso";
  message: string;
  bairro: string;
  cidade: string;
  uf: string;
  endereco: EnderecoFreteConsultado;
  opcoesEntrega?: OpcaoEntregaCotada[];
}

export interface ConsultaFreteFalha {
  found: false;
  message: string;
  endereco?: EnderecoFreteConsultado;
  opcoesEntrega?: OpcaoEntregaCotada[];
}

export type ConsultaFreteResult = ConsultaFreteSucesso | ConsultaFreteFalha;

export type EnderecoFreteConsultado = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type OpcaoEntregaCotada = {
  identificador: string;
  provedor: string;
  servico: string;
  nome: string;
  prazo: string | null;
  valorEmCentavos: number;
};
