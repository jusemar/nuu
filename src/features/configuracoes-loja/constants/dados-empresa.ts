/**
 * Identidade pública e dados empresariais oficiais da loja.
 *
 * Esta é a fonte única para informações institucionais que não dependem de
 * configuração operacional. Credenciais, IDs de integrações e remetentes de
 * e-mail transacional continuam exclusivamente nas variáveis de ambiente.
 */
export const DADOS_EMPRESA = {
  marca: "Nooo",
  iniciaisMarca: "N",
  razaoSocial: "48.732.308 Jusemar Rocha Junior",
  cnpj: "48.732.308/0001-58",
  endereco: {
    logradouro: "Av. Perimetral",
    numero: "3368",
    bairro: "Vila Santa Rita",
    cidade: "Belo Horizonte",
    estado: "MG",
    cep: "31668-635",
    pais: "Brasil",
  },
  telefone: {
    exibicao: "(31) 98842-1694",
    e164: "+5531988421694",
    whatsappOperacional: "5531988421694",
  },
  emailAtendimento: "contato@nooo.com.br",
  site: "https://nooo.com.br",
} as const;

/** Endereço completo pronto para apresentação institucional. */
export const ENDERECO_EMPRESA_FORMATADO = [
  `${DADOS_EMPRESA.endereco.logradouro}, ${DADOS_EMPRESA.endereco.numero}`,
  DADOS_EMPRESA.endereco.bairro,
  `${DADOS_EMPRESA.endereco.cidade} - ${DADOS_EMPRESA.endereco.estado}`,
  `CEP ${DADOS_EMPRESA.endereco.cep}`,
  DADOS_EMPRESA.endereco.pais,
].join(", ");
