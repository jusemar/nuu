import {
  FERRAMENTAS_AUTENTICADAS_ATIVAS,
  OPERACOES_CONFIRMADAS_BLOQUEADAS,
  OPERACOES_PROIBIDAS,
  VERSAO_FERRAMENTAS_PROTEGIDAS,
} from "../../constants/ferramentas-protegidas";
import type { FontesFerramentasProtegidas } from "../../queries/fontes-ferramentas-protegidas";
import {
  argumentosConsultarEnderecosClienteSchema,
  argumentosListarPedidosClienteSchema,
  argumentosPedidoClienteSchema,
  resultadoEnderecosClienteSchema,
  resultadoFerramentaProtegidaSchema,
  resultadoListarPedidosClienteSchema,
  resultadoPedidoClienteSchema,
} from "../../schemas/ferramentas-protegidas.schema";
import type { FerramentaProtegida } from "../../types/ferramentas-protegidas";

const definicao = (
  name: string,
  description: string,
  parameters: Record<string, unknown>,
) => ({ description, name, parameters, strict: true as const, type: "function" as const });

const parametrosPedido = {
  additionalProperties: false,
  properties: { referencia_pedido: { format: "uuid", type: "string" } },
  required: ["referencia_pedido"],
  type: "object",
};

export function criarCatalogoFerramentasProtegidas(fontes: FontesFerramentasProtegidas) {
  const autenticadas: FerramentaProtegida[] = [
    {
      dadosMinimosPermitidos: ["numero_pedido", "situacao", "pagamento", "total_em_centavos", "criado_em", "referencia_pedido"],
      definicao: definicao(
        "listar_pedidos_cliente",
        "Lista somente pedidos pertencentes ao cliente autenticado na sessão atual.",
        {
          additionalProperties: false,
          properties: { limite: { maximum: 20, minimum: 1, type: "integer" } },
          required: ["limite"],
          type: "object",
        },
      ),
      finalidade: "Listar pedidos do cliente autenticado.",
      habilitada: true,
      handler: async ({ argumentos, sessao }) => ({
        dados: {
          pedidos: await fontes.listarPedidos(sessao.usuarioId, Number(argumentos.limite)),
        },
        status: "concluida",
      }),
      id: "listar_pedidos_cliente",
      nivel: "autenticada",
      politicaConfirmacao: "nao_aplicavel",
      politicaIdempotencia: "por_consulta",
      schemaArgumentos: argumentosListarPedidosClienteSchema,
      schemaResultado: resultadoListarPedidosClienteSchema,
      versao: VERSAO_FERRAMENTAS_PROTEGIDAS,
    },
    ...(["consultar_pedido_cliente", "acompanhar_pedido_cliente"] as const).map(
      (nome): FerramentaProtegida => ({
        dadosMinimosPermitidos: ["numero_pedido", "situacao", "pagamento", "itens", "rastreio", "total_em_centavos", "criado_em"],
        definicao: definicao(
          nome,
          nome === "consultar_pedido_cliente"
            ? "Consulta dados mínimos de um pedido pertencente ao cliente autenticado."
            : "Acompanha a situação de um pedido pertencente ao cliente autenticado.",
          parametrosPedido,
        ),
        finalidade: "Consultar pedido próprio sem permitir enumeração de terceiros.",
        habilitada: true,
        handler: async ({ argumentos, sessao }) => {
          const pedido = await fontes.consultarPedido(
            sessao.usuarioId,
            String(argumentos.referencia_pedido),
          );
          return pedido
            ? { dados: { pedido }, status: "concluida" }
            : { dados: null, status: "nao_encontrada" };
        },
        id: nome,
        nivel: "autenticada",
        politicaConfirmacao: "nao_aplicavel",
        politicaIdempotencia: "por_consulta",
        schemaArgumentos: argumentosPedidoClienteSchema,
        schemaResultado: resultadoPedidoClienteSchema,
        versao: VERSAO_FERRAMENTAS_PROTEGIDAS,
      }),
    ),
    {
      dadosMinimosPermitidos: ["rua", "bairro", "cidade", "estado", "cep", "principal"],
      definicao: definicao(
        "consultar_enderecos_cliente",
        "Consulta endereços mascarados pertencentes ao cliente autenticado.",
        { additionalProperties: false, properties: {}, required: [], type: "object" },
      ),
      finalidade: "Consultar endereços mascarados do cliente.",
      habilitada: true,
      handler: async ({ sessao }) => ({
        dados: { enderecos: await fontes.consultarEnderecos(sessao.usuarioId) },
        status: "concluida",
      }),
      id: "consultar_enderecos_cliente",
      nivel: "autenticada",
      politicaConfirmacao: "nao_aplicavel",
      politicaIdempotencia: "por_consulta",
      schemaArgumentos: argumentosConsultarEnderecosClienteSchema,
      schemaResultado: resultadoEnderecosClienteSchema,
      versao: VERSAO_FERRAMENTAS_PROTEGIDAS,
    },
  ];

  const bloqueadas: FerramentaProtegida[] = [
    ...OPERACOES_CONFIRMADAS_BLOQUEADAS.map((nome) => ({
      dadosMinimosPermitidos: [],
      definicao: definicao(nome, "Operação com efeito real indisponível.", { additionalProperties: false, properties: {}, required: [], type: "object" }),
      finalidade: "Mantida bloqueada por ausência de fluxo comercial oficial aprovado.",
      habilitada: false,
      id: nome,
      nivel: "confirmada" as const,
      politicaConfirmacao: "obrigatoria" as const,
      politicaIdempotencia: "obrigatoria" as const,
      schemaArgumentos: argumentosConsultarEnderecosClienteSchema,
      schemaResultado: resultadoFerramentaProtegidaSchema,
      versao: VERSAO_FERRAMENTAS_PROTEGIDAS,
    })),
    ...OPERACOES_PROIBIDAS.map((nome) => ({
      dadosMinimosPermitidos: [],
      definicao: definicao(nome, "Operação proibida ao Atendente IA.", { additionalProperties: false, properties: {}, required: [], type: "object" }),
      finalidade: "Operação administrativa ou comercial proibida.",
      habilitada: false,
      id: nome,
      nivel: "proibida" as const,
      politicaConfirmacao: "nao_aplicavel" as const,
      politicaIdempotencia: "bloqueada" as const,
      schemaArgumentos: argumentosConsultarEnderecosClienteSchema,
      schemaResultado: resultadoFerramentaProtegidaSchema,
      versao: VERSAO_FERRAMENTAS_PROTEGIDAS,
    })),
  ];
  const ferramentas = [...autenticadas, ...bloqueadas];
  if (!FERRAMENTAS_AUTENTICADAS_ATIVAS.every((nome) => ferramentas.some((item) => item.id === nome))) {
    throw new Error("REGISTRO_FERRAMENTAS_PROTEGIDAS_INCOMPLETO");
  }
  return new Map(ferramentas.map((ferramenta) => [ferramenta.id, ferramenta]));
}
