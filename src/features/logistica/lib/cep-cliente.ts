import {
  CHAVE_STORAGE_CEP_CLIENTE,
  EVENTO_CEP_CLIENTE_ATUALIZADO,
  EVENTO_ENDERECO_CLIENTE_ATUALIZADO,
} from "../constants/cep-cliente";

export type OrigemCepCliente = "manual" | "endereco" | "carrinho" | null;

export function normalizarCepCliente(cep: string) {
  return cep.replace(/\D/g, "").slice(0, 8);
}

export function registrarCepClienteIdentificado(cep: string) {
  if (typeof window === "undefined") return;

  const cepNormalizado = normalizarCepCliente(cep);
  if (cepNormalizado.length !== 8) return;

  window.localStorage.setItem(CHAVE_STORAGE_CEP_CLIENTE, cepNormalizado);
  window.dispatchEvent(
    new CustomEvent(EVENTO_CEP_CLIENTE_ATUALIZADO, {
      detail: cepNormalizado,
    }),
  );
}

export function resolverCepCliente({
  cepManual,
  cepEndereco,
  cepCarrinho,
}: {
  cepManual?: string | null;
  cepEndereco?: string | null;
  cepCarrinho?: string | null;
}): { cep: string; origem: OrigemCepCliente } {
  const candidatos = [
    { cep: cepManual, origem: "manual" as const },
    { cep: cepEndereco, origem: "endereco" as const },
    { cep: cepCarrinho, origem: "carrinho" as const },
  ];

  for (const candidato of candidatos) {
    const cep = normalizarCepCliente(candidato.cep ?? "");
    if (cep.length === 8) return { cep, origem: candidato.origem };
  }

  return { cep: "", origem: null };
}

export function resolverCepEnderecoCliente({
  cepSelecionado,
  cepPrincipal,
  cepPadrao,
}: {
  cepSelecionado?: string | null;
  cepPrincipal?: string | null;
  cepPadrao?: string | null;
}) {
  for (const candidato of [cepSelecionado, cepPrincipal, cepPadrao]) {
    const cep = normalizarCepCliente(candidato ?? "");
    if (cep.length === 8) return cep;
  }
  return null;
}

export function notificarEnderecoClienteAtualizado() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_ENDERECO_CLIENTE_ATUALIZADO));
}
