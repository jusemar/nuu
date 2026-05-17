import type { ConfiguracaoPagamentoCalculavel } from "../../../types/precificacao.types";
import { FormularioConfiguracaoPagamento } from "./formulario-configuracao-pagamento";

type PaginaConfiguracaoPrecificacaoProps = {
  configuracaoPagamento: ConfiguracaoPagamentoCalculavel;
};

export function PaginaConfiguracaoPrecificacao({
  configuracaoPagamento,
}: PaginaConfiguracaoPrecificacaoProps) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-600">Precificação</p>
        <h1 className="text-2xl font-semibold tracking-normal text-gray-950 md:text-3xl">
          Regras de preço e parcelamento
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-gray-600">
          Centralize as regras comerciais para manter vitrine, carrinho,
          checkout e gateways sempre usando a mesma fonte de verdade.
        </p>
      </div>

      <FormularioConfiguracaoPagamento
        configuracaoInicial={configuracaoPagamento}
      />
    </section>
  );
}
