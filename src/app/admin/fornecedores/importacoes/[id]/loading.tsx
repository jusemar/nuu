import { EsqueletoEtapaFornecedor } from "@/features/fornecedores/components/admin/compartilhados/esqueleto-etapa-fornecedor";

/**
 * Mostrado enquanto a página da importação carrega no servidor.
 *
 * A rota dispara sete leituras (staging paginado, staging completo, revisão,
 * rascunhos, opções de mapeamento…) e isso leva alguns segundos. Sem este
 * arquivo o Next segurava a navegação inteira e a tela anterior ficava parada,
 * o que o gestor lia como travamento.
 */
export default function Loading() {
  return (
    <EsqueletoEtapaFornecedor
      titulo="Abrindo importação"
      descricao="Carregando linhas, vínculos e mapeamento desta importação."
    />
  );
}
