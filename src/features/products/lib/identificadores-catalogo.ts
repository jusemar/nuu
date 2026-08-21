export type TipoGtin = "gtin_8" | "gtin_12" | "gtin_13" | "gtin_14";
export type OrigemIdentificador = "manual_admin" | "fornecedor_importacao";
export type StatusIdentificador =
  | "pendente"
  | "verificado"
  | "rejeitado"
  | "conflito";

export type ResultadoValidacaoGtin =
  | { valido: true; valor: string; tipo: TipoGtin }
  | {
      valido: false;
      motivo:
        | "vazio"
        | "caracteres_invalidos"
        | "comprimento_invalido"
        | "placeholder"
        | "faixa_restrita_google"
        | "digito_verificador_invalido";
    };

export type ResultadoValidacaoMpn =
  | { valido: true; valor: string }
  | {
      valido: false;
      motivo:
        | "nao_declarado_como_mpn"
        | "vazio"
        | "muito_longo"
        | "caracteres_de_controle";
    };

/** Remove apenas espaços externos; zeros à esquerda nunca são descartados. */
export function normalizarGtin(valor: string | null | undefined): string {
  return (valor ?? "").trim();
}

export function identificarTipoGtin(valor: string): TipoGtin | null {
  const tiposPorComprimento: Partial<Record<number, TipoGtin>> = {
    8: "gtin_8",
    12: "gtin_12",
    13: "gtin_13",
    14: "gtin_14",
  };
  return tiposPorComprimento[valor.length] ?? null;
}

/** Implementa o dígito verificador GS1 Mod-10 a partir da direita. */
export function validarDigitoVerificadorGtin(valor: string): boolean {
  if (!/^\d+$/.test(valor) || !identificarTipoGtin(valor)) return false;

  const digitosSemVerificador = valor.slice(0, -1).split("").map(Number);
  const digitoInformado = Number(valor.at(-1));
  const soma = digitosSemVerificador
    .reverse()
    .reduce((total, digito, indice) => {
      return total + digito * (indice % 2 === 0 ? 3 : 1);
    }, 0);
  const digitoCalculado = (10 - (soma % 10)) % 10;
  return digitoCalculado === digitoInformado;
}

function ehPlaceholderGtin(valor: string) {
  if (/^(\d)\1+$/.test(valor)) return true;
  const crescente = "0123456789".repeat(2);
  const decrescente = "9876543210".repeat(2);
  return crescente.includes(valor) || decrescente.includes(valor);
}

/** Faixas reservadas/restritas e cupons que o Merchant Center rejeita. */
function pertenceFaixaRestritaGoogle(valor: string) {
  // No GTIN-14 o primeiro dígito é o indicador de embalagem; o prefixo GS1
  // começa no dígito seguinte. Nos demais formatos começa no próprio valor.
  const prefixo = valor.length === 14 ? valor.slice(1) : valor;
  return ["02", "04", "2", "05", "98", "99"].some((faixa) =>
    prefixo.startsWith(faixa),
  );
}

export function validarGtin(
  valorBruto: string | null | undefined,
): ResultadoValidacaoGtin {
  const valor = normalizarGtin(valorBruto);
  if (!valor) return { valido: false, motivo: "vazio" };
  if (!/^\d+$/.test(valor)) {
    return { valido: false, motivo: "caracteres_invalidos" };
  }

  const tipo = identificarTipoGtin(valor);
  if (!tipo) return { valido: false, motivo: "comprimento_invalido" };
  if (ehPlaceholderGtin(valor)) {
    return { valido: false, motivo: "placeholder" };
  }
  if (pertenceFaixaRestritaGoogle(valor)) {
    return { valido: false, motivo: "faixa_restrita_google" };
  }
  if (!validarDigitoVerificadorGtin(valor)) {
    return { valido: false, motivo: "digito_verificador_invalido" };
  }
  return { valido: true, valor, tipo };
}

/**
 * MPN só é aceito quando a fonte o declarou explicitamente como MPN. O texto
 * não é comparado nem inferido a partir de SKU ou códigos internos.
 */
export function validarMpnBasico({
  valor: valorBruto,
  declaradoExplicitamente,
}: {
  valor: string | null | undefined;
  declaradoExplicitamente: boolean;
}): ResultadoValidacaoMpn {
  if (!declaradoExplicitamente) {
    return { valido: false, motivo: "nao_declarado_como_mpn" };
  }
  const valor = (valorBruto ?? "").trim();
  if (!valor) return { valido: false, motivo: "vazio" };
  if (valor.length > 120) return { valido: false, motivo: "muito_longo" };
  if (/[\u0000-\u001f\u007f]/.test(valor)) {
    return { valido: false, motivo: "caracteres_de_controle" };
  }
  return { valido: true, valor };
}

type IdentificadorParaConflito = {
  valor: string;
  origem: OrigemIdentificador;
  status: StatusIdentificador;
};

export type ClassificacaoConflitoIdentificador =
  | { acao: "aceitar" }
  | { acao: "manter"; motivo: "mesmo_valor" }
  | { acao: "substituir"; motivo: "manual_substitui_fornecedor_pendente" }
  | {
      acao: "conflito";
      motivo:
        | "existente_verificado"
        | "manual_protegido"
        | "fontes_divergentes";
      preservarExistente: true;
    };

/** Classifica a escrita antes de qualquer persistência ou sobrescrita. */
export function classificarConflitoIdentificador({
  existente,
  recebido,
}: {
  existente: IdentificadorParaConflito | null;
  recebido: IdentificadorParaConflito;
}): ClassificacaoConflitoIdentificador {
  if (!existente) return { acao: "aceitar" };
  if (existente.valor === recebido.valor) {
    return { acao: "manter", motivo: "mesmo_valor" };
  }
  if (existente.status === "verificado") {
    return {
      acao: "conflito",
      motivo: "existente_verificado",
      preservarExistente: true,
    };
  }
  if (
    existente.origem === "manual_admin" &&
    recebido.origem === "fornecedor_importacao"
  ) {
    return {
      acao: "conflito",
      motivo: "manual_protegido",
      preservarExistente: true,
    };
  }
  if (
    existente.origem === "fornecedor_importacao" &&
    recebido.origem === "manual_admin"
  ) {
    return {
      acao: "substituir",
      motivo: "manual_substitui_fornecedor_pendente",
    };
  }
  return {
    acao: "conflito",
    motivo: "fontes_divergentes",
    preservarExistente: true,
  };
}
