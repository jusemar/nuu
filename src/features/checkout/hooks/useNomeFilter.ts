import { useCallback } from "react";

import { isValidNome, normalizarNome } from "../lib/validators";

export function useNomeFilter() {
  const aplicarMascaraNome = useCallback((valor: string) => {
    return normalizarNome(valor);
  }, []);

  return {
    aplicarMascaraNome,
    validarNome: isValidNome,
  };
}
