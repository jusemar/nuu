import { useCallback } from "react";

import {
  formatarTelefone,
  isValidTelefone,
  limparDigitos,
} from "../lib/validators";

export function useTelefoneMask() {
  const aplicarMascaraTelefone = useCallback((valor: string) => {
    return formatarTelefone(valor);
  }, []);

  return {
    aplicarMascaraTelefone,
    limparTelefone: limparDigitos,
    validarTelefone: isValidTelefone,
  };
}
