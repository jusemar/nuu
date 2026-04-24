// Tipos TypeScript para o domínio de Logística — Retirada Local
// Inferidos do schema do Drizzle + tipos customizados para UI/API

// ============================================
// TIPOS INFERNIDOS DAS TABELAS (SELECT)
// ============================================

// Tipos base inferidos — serão importados do barrel do banco
// Estes tipos representam exatamente o que está no banco

export type ConfigHorario = {
  id: string;
  horaAbertura: string;        // formato "HH:MM"
  horaFechamento: string;      // formato "HH:MM"
  usaIntervaloAlmoco: boolean;
  horaAlmocoInicio: string | null;   // formato "HH:MM"
  horaAlmocoFim: string | null;      // formato "HH:MM"
  diasFuncionamento: string[];       // ex: ["Seg", "Ter", "Qua", "Qui", "Sex"]
  createdAt: Date;
  updatedAt: Date;
};

export type Feriado = {
  id: string;
  data: string;                // formato "YYYY-MM-DD"
  descricao: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ModalidadeRetirada = {
  id: string;
  nome: string;                // "Imediato", "Rápido", "Sob encomenda"
  slug: string;                // "imediato", "rapido", "sob-encomenda"
  ativo: boolean;
  config: {
    horarioCorte?: string;     // apenas para "Rápido" — formato "HH:MM"
    prazoDias?: number;        // apenas para "Sob encomenda"
    tipoContagem?: "uteis" | "corridos";  // apenas para "Sob encomenda"
  };
  mensagemPadrao: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PontoColeta = {
  id: string;
  nome: string;
  slug: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  ativo: boolean;
  herdaHorarioGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProdutoRetirada = {
  id: string;
  productId: string;           // FK para productTable
  pontoColetaId: string;       // FK para pontosColeta
  modalidadeId: string;        // FK para modalidadesRetirada
  mensagemPersonalizada: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================
// TIPOS PARA FORMULÁRIOS (INSERT/UPDATE)
// ============================================

// Omitimos campos gerados automaticamente pelo banco

export type CriarConfigHorario = Omit<ConfigHorario, "id" | "createdAt" | "updatedAt">;
export type AtualizarConfigHorario = Partial<CriarConfigHorario>;

export type CriarFeriado = Omit<Feriado, "id" | "createdAt" | "updatedAt">;
export type AtualizarFeriado = Partial<CriarFeriado>;

export type CriarModalidade = Omit<ModalidadeRetirada, "id" | "createdAt" | "updatedAt">;
export type AtualizarModalidade = Partial<CriarModalidade>;

export type CriarPontoColeta = Omit<PontoColeta, "id" | "createdAt" | "updatedAt">;
export type AtualizarPontoColeta = Partial<CriarPontoColeta>;

export type CriarProdutoRetirada = Omit<ProdutoRetirada, "id" | "createdAt" | "updatedAt">;
export type AtualizarProdutoRetirada = Partial<CriarProdutoRetirada>;

// ============================================
// TIPOS CUSTOMIZADOS PARA UI/API
// ============================================

// DTO para exibição no admin (com dados relacionados embutidos)
export type PontoColetaComHorario = PontoColeta & {
  horario?: ConfigHorario | null;  // null quando herda global
};

// DTO para exibição na loja (visão do cliente)
export type OpcaoRetiradaCliente = {
  modalidade: ModalidadeRetirada;
  ponto: PontoColeta;
  prazoTexto: string;            // "Retira hoje · até 18h"
  horarioFuncionamento: string;   // "Seg–Sex, 08h às 18h"
};

// Estado do formulário da aba "Entrega" do produto
export type FormEntregaProduto = {
  permiteRetirada: boolean;
  pontosSelecionados: string[];     // IDs dos pontos
  modalidadeId: string | null;
  mensagemPersonalizada: string;
};

// Resposta da API para cálculo de prazo
export type CalculoPrazoRetirada = {
  podeRetirarHoje: boolean;
  dataRetirada: string;             // "2026-04-23"
  dataRetiradaFormatada: string;    // "hoje", "amanhã", "em 3 dias úteis"
  horarioLimite: string | null;     // "18:00" ou null
  mensagem: string;
};