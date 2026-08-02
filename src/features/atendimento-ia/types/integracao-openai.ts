import type { ContextoControlado } from "./contexto";
import type { DefinicaoFerramentaOpenAi } from "./ferramentas-publicas";

export type RequisicaoResponsesOpenAi = {
  input:
    | string
    | Array<
        | Record<string, unknown>
        | {
            call_id: string;
            output: string;
            type: "function_call_output";
          }
      >;
  instructions: string;
  max_output_tokens: number;
  model: "gpt-5.6-terra" | "gpt-5.6-sol";
  safety_identifier: string;
  store: false;
  stream: false;
  text: {
    format: {
      name: string;
      schema: Record<string, unknown>;
      strict: true;
      type: "json_schema";
    };
  };
  tool_choice: "auto";
  tools: DefinicaoFerramentaOpenAi[];
  truncation: "disabled";
};

export type RespostaResponsesOpenAi = {
  error: { code?: string; message?: string } | null;
  id: string;
  incomplete_details: unknown;
  model: string;
  output: Array<Record<string, unknown>>;
  output_text: string;
  request_id?: string | null;
  status:
    | "completed"
    | "failed"
    | "in_progress"
    | "cancelled"
    | "queued"
    | "incomplete";
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
};

export type OpcoesChamadaResponses = {
  maxRetries: 0;
  timeout: number;
};

export interface ClienteResponsesOpenAi {
  criar(
    requisicao: RequisicaoResponsesOpenAi,
    opcoes: OpcoesChamadaResponses,
  ): Promise<RespostaResponsesOpenAi>;
}

export type ConfiguracaoIntegracaoOpenAi = {
  escalonamentoAtivo: boolean;
  maxOutputTokens: number;
  maxTentativas: number;
  timeoutEmMs: number;
  maxContextTokens: number;
};

export type DadosPermitidosModelo = ContextoControlado["dados"];

export class ErroClienteResponsesOpenAi extends Error {
  constructor(
    public readonly categoria:
      | "autenticacao"
      | "cancelamento"
      | "indisponibilidade"
      | "quota"
      | "rate_limit"
      | "requisicao_invalida"
      | "timeout",
  ) {
    super(categoria);
  }
}
