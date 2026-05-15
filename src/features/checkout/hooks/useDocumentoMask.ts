import { useCallback } from "react";

import {
  formatarDocumento,
  isValidCPFOrCNPJ,
  limparDigitos,
  obterTipoDocumento,
} from "../lib/validators";

export function useDocumentoMask() {
  const aplicarMascaraDocumento = useCallback((valor: string) => {
    return formatarDocumento(valor);
  }, []);

  return {
    aplicarMascaraDocumento,
    limparDocumento: limparDigitos,
    obterTipoDocumento,
    validarDocumento: isValidCPFOrCNPJ,
  };
}
