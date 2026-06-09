"use server";

import { validarCupomPromocao as validarCupomPromocaoService } from "../services/validar-cupom-promocao";

export async function validarCupomPromocao(entrada: {
  codigoCupom: string;
  subtotalEmCentavos: number;
  clienteId?: string | null;
}) {
  return validarCupomPromocaoService(entrada);
}
