import type { OpcaoFrete } from "@/features/logistica/types/contratos-frete";

export function resumirMetadadosOpcaoEntrega(
  metadados?: Record<string, unknown> | null,
) {
  if (!metadados) return null;

  const camposEscalares = Object.entries(metadados)
    .filter(([, valor]) =>
      ["string", "number", "boolean"].includes(typeof valor),
    )
    .slice(0, 12);
  const resumo: Record<string, unknown> = Object.fromEntries(camposEscalares);

  for (const campo of [
    "promessaEntregaPropria",
    "promessaEntregaProgramada",
    "regiaoEntregaPropria",
  ]) {
    const valor = metadados[campo];
    if (valor && typeof valor === "object") resumo[campo] = valor;
  }

  return Object.keys(resumo).length > 0 ? resumo : null;
}

export function obterTransportadoraOpcaoEntrega(opcao: OpcaoFrete) {
  return typeof opcao.metadados?.transportadora === "string"
    ? opcao.metadados.transportadora
    : null;
}

export function formatarPrazoOpcaoEntrega(opcao: {
  descricao?: string | null;
  prazoMinimoEmDiasUteis?: number | null;
  prazoMaximoEmDiasUteis?: number | null;
}) {
  if (opcao.descricao?.trim()) return opcao.descricao.trim();

  const minimo = opcao.prazoMinimoEmDiasUteis;
  const maximo = opcao.prazoMaximoEmDiasUteis;
  if (minimo == null && maximo == null) return null;
  if (minimo === maximo || maximo == null) return `${minimo} dias uteis`;
  return `${minimo ?? maximo} a ${maximo} dias uteis`;
}

