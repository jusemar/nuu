import { z } from "zod";

import type { ProvedorFrete } from "../types/contratos-frete";

const esquemaTextoObrigatorio = z.string().trim().min(1);
const esquemaInteiroPositivo = z.number().int().positive();
const esquemaInteiroNaoNegativo = z.number().int().nonnegative();

export const esquemaDimensoesPacote = z.object({
  alturaEmCm: esquemaInteiroPositivo,
  larguraEmCm: esquemaInteiroPositivo,
  comprimentoEmCm: esquemaInteiroPositivo,
});

export const esquemaEnderecoEntrega = z.object({
  cep: z
    .string()
    .trim()
    .transform((cep) => cep.replace(/\D/g, ""))
    .pipe(z.string().length(8)),
  rua: esquemaTextoObrigatorio.optional().nullable(),
  numero: esquemaTextoObrigatorio.optional().nullable(),
  complemento: esquemaTextoObrigatorio.optional().nullable(),
  bairro: esquemaTextoObrigatorio.optional().nullable(),
  cidade: esquemaTextoObrigatorio.optional().nullable(),
  estado: z.string().trim().length(2).toUpperCase().optional().nullable(),
  pais: z.literal("BR").default("BR"),
});

export const esquemaItemLogistico = z.object({
  identificador: esquemaTextoObrigatorio,
  produtoId: esquemaTextoObrigatorio,
  varianteId: esquemaTextoObrigatorio.optional().nullable(),
  nome: esquemaTextoObrigatorio,
  codigoSku: esquemaTextoObrigatorio.optional().nullable(),
  quantidade: esquemaInteiroPositivo,
  pesoEmGramas: esquemaInteiroPositivo,
  dimensoes: esquemaDimensoesPacote,
  valorDeclaradoEmCentavos: esquemaInteiroNaoNegativo.optional().nullable(),
});

export const esquemaPacoteEnvio = z.object({
  identificador: esquemaTextoObrigatorio,
  itens: z.array(esquemaItemLogistico).min(1),
  quantidadeVolumes: esquemaInteiroPositivo.default(1),
  pesoTotalEmGramas: esquemaInteiroPositivo,
  dimensoes: esquemaDimensoesPacote,
});

export const esquemaSolicitacaoCotacaoFrete = z.object({
  identificador: esquemaTextoObrigatorio,
  destino: esquemaEnderecoEntrega,
  itens: z.array(esquemaItemLogistico).min(1),
  pacotes: z.array(esquemaPacoteEnvio).default([]),
  moeda: z.literal("BRL").default("BRL"),
});

export const esquemaOpcaoFrete = z
  .object({
    identificador: esquemaTextoObrigatorio,
    provedor: esquemaTextoObrigatorio,
    servico: esquemaTextoObrigatorio,
    nome: esquemaTextoObrigatorio,
    tipo: z.enum(["entrega", "retirada"]),
    valorEmCentavos: esquemaInteiroNaoNegativo,
    prazoMinimoEmDiasUteis: esquemaInteiroNaoNegativo.optional().nullable(),
    prazoMaximoEmDiasUteis: esquemaInteiroNaoNegativo.optional().nullable(),
    descricao: esquemaTextoObrigatorio.optional().nullable(),
    metadados: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .superRefine((opcao, contexto) => {
    if (
      opcao.prazoMinimoEmDiasUteis !== null &&
      opcao.prazoMinimoEmDiasUteis !== undefined &&
      opcao.prazoMaximoEmDiasUteis !== null &&
      opcao.prazoMaximoEmDiasUteis !== undefined &&
      opcao.prazoMinimoEmDiasUteis > opcao.prazoMaximoEmDiasUteis
    ) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prazoMaximoEmDiasUteis"],
        message: "O prazo maximo deve ser maior ou igual ao prazo minimo.",
      });
    }
  });

export const esquemaSelecaoFrete = z.object({
  identificador: esquemaTextoObrigatorio,
  identificadorCotacao: esquemaTextoObrigatorio,
  opcao: esquemaOpcaoFrete,
  destino: esquemaEnderecoEntrega,
  pacotes: z.array(esquemaPacoteEnvio).default([]),
  selecionadaEm: z.date(),
});

export const esquemaErroCotacaoFrete = z.object({
  codigo: esquemaTextoObrigatorio,
  mensagem: esquemaTextoObrigatorio,
  provedor: esquemaTextoObrigatorio.optional().nullable(),
});

export const esquemaResultadoCotacaoFrete = z.discriminatedUnion("sucesso", [
  z.object({
    sucesso: z.literal(true),
    solicitacao: esquemaSolicitacaoCotacaoFrete,
    opcoes: z.array(esquemaOpcaoFrete),
    avisos: z.array(esquemaTextoObrigatorio).default([]),
  }),
  z.object({
    sucesso: z.literal(false),
    solicitacao: esquemaSolicitacaoCotacaoFrete,
    opcoes: z.array(esquemaOpcaoFrete).default([]),
    erros: z.array(esquemaErroCotacaoFrete).min(1),
  }),
]);

export const esquemaProvedorFrete = z.object({
  identificador: esquemaTextoObrigatorio,
  nome: esquemaTextoObrigatorio,
  ativo: z.boolean(),
  cotarFrete: z.custom<ProvedorFrete["cotarFrete"]>(
    (valor) => typeof valor === "function",
    "O provedor precisa expor uma funcao de cotacao.",
  ),
});
