import type { LinhaPreviewAlteracaoEmMassa } from "../lib/alteracao-em-massa/calcular-preview-alteracao-em-massa";

export type ResumoPreviewAlteracaoEmMassa = {
  produtosSelecionados: number;
  produtosSimples: number;
  produtosIgnorados: number;
  alteracoesEfetivas: number;
  semMudanca: number;
  conflitos: number;
  campos: string[];
};

export type PreviewServidorAlteracaoEmMassa = {
  linhas: LinhaPreviewAlteracaoEmMassa[];
  resumo: ResumoPreviewAlteracaoEmMassa;
  assinaturaPreview: string;
};

export type ResultadoAplicacaoAlteracaoEmMassa = {
  status: "sucesso" | "parcial" | "falha";
  alterados: number;
  ignorados: number;
  semMudanca: number;
  erros: number;
  detalhes: Array<{
    produtoId: string;
    produto: string;
    resultado: "alterado" | "ignorado" | "sem_alteracao" | "erro";
    mensagem?: string;
  }>;
};
