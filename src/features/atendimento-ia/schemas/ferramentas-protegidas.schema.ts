import { z } from "zod";

export const argumentosListarPedidosClienteSchema = z
  .object({ limite: z.number().int().min(1).max(20) })
  .strict();

export const argumentosPedidoClienteSchema = z
  .object({ referencia_pedido: z.string().uuid() })
  .strict();

export const argumentosConsultarEnderecosClienteSchema = z.object({}).strict();

const statusResultadoFerramentaProtegidaSchema = z.enum([
      "concluida",
      "bloqueada",
      "nao_autorizada",
      "autenticacao_necessaria",
      "confirmacao_necessaria",
      "confirmacao_invalida",
      "confirmacao_expirada",
      "nao_encontrada",
      "nao_elegivel",
      "indisponivel",
      "falha_sem_execucao",
      "resultado_incerto",
      "ja_executada",
]);

const criarResultadoSchema = (dados: z.ZodType) => z.object({
  dados: dados.nullable(),
  status: statusResultadoFerramentaProtegidaSchema,
}).strict();

const pedidoResumidoSchema = z.object({
  criado_em: z.string().datetime(),
  numero_pedido: z.string(),
  pagamento: z.string(),
  referencia_pedido: z.string().uuid(),
  situacao: z.string(),
  total_em_centavos: z.number().int().nonnegative(),
}).strict();

export const resultadoListarPedidosClienteSchema = criarResultadoSchema(
  z.object({ pedidos: z.array(pedidoResumidoSchema).max(20) }).strict(),
);

export const resultadoPedidoClienteSchema = criarResultadoSchema(z.object({
  pedido: z.object({
    criado_em: z.string().datetime(),
    itens: z.array(z.object({
      modalidade: z.string(),
      nome: z.string(),
      quantidade: z.number().int().positive(),
      variante: z.string().nullable(),
    }).strict()).max(100),
    numero_pedido: z.string(),
    pagamento: z.string(),
    rastreio: z.string().nullable(),
    situacao: z.string(),
    total_em_centavos: z.number().int().nonnegative(),
  }).strict(),
}).strict());

export const resultadoEnderecosClienteSchema = criarResultadoSchema(z.object({
  enderecos: z.array(z.object({
    bairro: z.string(),
    cep: z.string(),
    cidade: z.string(),
    estado: z.string(),
    principal: z.boolean(),
    rua: z.string(),
  }).strict()).max(10),
}).strict());

export const resultadoFerramentaProtegidaSchema = criarResultadoSchema(
  z.record(z.string(), z.unknown()),
);
