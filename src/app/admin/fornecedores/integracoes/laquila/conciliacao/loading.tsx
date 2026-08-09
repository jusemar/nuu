import { EsqueletoEtapaFornecedor } from "@/features/fornecedores/components/admin/compartilhados/esqueleto-etapa-fornecedor";

/** Mesmo vocabulário visual das duas origens; só a mensagem muda. */
export default function Loading() {
  return (
    <EsqueletoEtapaFornecedor
      titulo="Preparando conciliação"
      descricao="Carregando os itens e os dados atuais da loja."
    />
  );
}
