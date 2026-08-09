import { EsqueletoEtapaFornecedor } from "@/features/fornecedores/components/admin/compartilhados/esqueleto-etapa-fornecedor";

/**
 * Carregamento simples de propósito: esta tela lê staging já persistido, não
 * consulta a API. A barra de progresso com etapas pertence à sincronização.
 */
export default function Loading() {
  return (
    <EsqueletoEtapaFornecedor
      titulo="Abrindo a importação"
      descricao="Carregando os produtos recebidos nesta execução."
    />
  );
}
