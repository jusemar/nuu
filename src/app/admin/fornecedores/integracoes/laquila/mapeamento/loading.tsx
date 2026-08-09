import { EsqueletoEtapaFornecedor } from "@/features/fornecedores/components/admin/compartilhados/esqueleto-etapa-fornecedor";

/** Mesmo vocabulário visual das duas origens; só a mensagem muda. */
export default function Loading() {
  return (
    <EsqueletoEtapaFornecedor
      titulo="Carregando mapeamento"
      descricao="Buscando campos recebidos da API do fornecedor."
    />
  );
}
