import type { OwnDeliveryDestinationType } from "../types/shipping";

export type DestinoPesquisavelEntregaPropria = {
  type: OwnDeliveryDestinationType;
  id: number;
  label: string;
  city: string;
  state: string;
};

const ROTULOS_TIPO_DESTINO: Record<OwnDeliveryDestinationType, string> = {
  region: "Regiao",
  "bairro-avulso": "Bairro avulso",
  "cep-especifico": "CEP especifico",
  cidade: "Cidade",
};

const NOMES_DIAS_ENTREGA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function formatarDiasEntregaPropria(dias: number[]) {
  return [...new Set(dias)]
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
    .sort((a, b) => a - b)
    .map((dia) => NOMES_DIAS_ENTREGA[dia])
    .join(", ");
}

/** Mantém a chave técnica usada pelo formulário, sem persistir o texto buscado. */
export function criarChaveDestinoEntregaPropria(
  destino: Pick<DestinoPesquisavelEntregaPropria, "type" | "id">,
) {
  return `${destino.type}:${destino.id}`;
}

export function formatarTipoDestinoEntregaPropria(
  tipo: OwnDeliveryDestinationType,
) {
  return ROTULOS_TIPO_DESTINO[tipo];
}

export function formatarDestinoEntregaPropria(
  destino: DestinoPesquisavelEntregaPropria,
) {
  return `${formatarTipoDestinoEntregaPropria(destino.type)} - ${destino.label} (${destino.city}/${destino.state})`;
}

function normalizarPesquisa(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Pesquisa o mesmo texto apresentado no combobox. A versão compacta permite
 * localizar CEP tanto com quanto sem hífen.
 */
export function filtrarDestinosEntregaPropria<
  T extends DestinoPesquisavelEntregaPropria,
>(destinos: T[], pesquisa: string): T[] {
  const termo = normalizarPesquisa(pesquisa);
  if (!termo) return destinos;

  const termoCompacto = termo.replace(/\s/g, "");

  return destinos.filter((destino) => {
    const texto = normalizarPesquisa(formatarDestinoEntregaPropria(destino));
    return (
      texto.includes(termo) || texto.replace(/\s/g, "").includes(termoCompacto)
    );
  });
}
