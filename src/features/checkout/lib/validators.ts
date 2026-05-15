const SOMENTE_DIGITOS = /\D/g;
const CARACTERES_NOME_INVALIDOS = /[^\p{L}\s'-]/gu;
const TEM_CARACTER_NOME_INVALIDO = /[^\p{L}\s'-]/u;

export function limparDigitos(valor: string): string {
  return valor.replace(SOMENTE_DIGITOS, "");
}

export function normalizarNome(nome: string): string {
  return nome
    .replace(CARACTERES_NOME_INVALIDOS, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|[\s'-])(\p{L})/gu, (match) =>
      match.toLocaleUpperCase("pt-BR"),
    );
}

export function isValidNome(nome: string): boolean {
  const nomeNormalizado = normalizarNome(nome).trim();
  const partes = nomeNormalizado.split(/\s+/).filter(Boolean);

  return (
    nomeNormalizado.length >= 3 &&
    partes.length >= 2 &&
    partes.every((parte) => parte.replace(/['-]/g, "").length >= 2) &&
    !TEM_CARACTER_NOME_INVALIDO.test(nomeNormalizado)
  );
}

export function formatarTelefone(valor: string): string {
  const digitos = limparDigitos(valor).slice(0, 11);

  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function isValidTelefone(telefone: string): boolean {
  const digitos = limparDigitos(telefone);
  const ddd = digitos.slice(0, 2);

  return digitos.length === 11 && ddd !== "00" && digitos[2] === "9";
}

export function formatarCPF(valor: string): string {
  const digitos = limparDigitos(valor).slice(0, 11);

  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function formatarCNPJ(valor: string): string {
  const digitos = limparDigitos(valor).slice(0, 14);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  if (digitos.length <= 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  }
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }

  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

export function formatarDocumento(valor: string): string {
  const digitos = limparDigitos(valor).slice(0, 14);

  return digitos.length <= 11 ? formatarCPF(digitos) : formatarCNPJ(digitos);
}

function todosDigitosIguais(valor: string): boolean {
  return /^(\d)\1+$/.test(valor);
}

export function isValidCPF(cpf: string): boolean {
  const digitos = limparDigitos(cpf);

  if (digitos.length !== 11 || todosDigitosIguais(digitos)) return false;

  const calcularDigito = (base: string, pesoInicial: number) => {
    const soma = base
      .split("")
      .reduce(
        (total, digito, index) =>
          total + Number(digito) * (pesoInicial - index),
        0,
      );
    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(digitos.slice(0, 9), 10);
  const segundoDigito = calcularDigito(digitos.slice(0, 10), 11);

  return (
    primeiroDigito === Number(digitos[9]) &&
    segundoDigito === Number(digitos[10])
  );
}

export function isValidCNPJ(cnpj: string): boolean {
  const digitos = limparDigitos(cnpj);

  if (digitos.length !== 14 || todosDigitosIguais(digitos)) return false;

  const calcularDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce(
        (total, digito, index) => total + Number(digito) * pesos[index],
        0,
      );
    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(
    digitos.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const segundoDigito = calcularDigito(
    digitos.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return (
    primeiroDigito === Number(digitos[12]) &&
    segundoDigito === Number(digitos[13])
  );
}

export function isValidCPFOrCNPJ(documento: string): boolean {
  const digitos = limparDigitos(documento);

  if (digitos.length === 11) return isValidCPF(digitos);
  if (digitos.length === 14) return isValidCNPJ(digitos);

  return false;
}

export function obterTipoDocumento(documento: string): "cpf" | "cnpj" | null {
  const digitos = limparDigitos(documento);

  if (digitos.length <= 11) return "cpf";
  if (digitos.length <= 14) return "cnpj";

  return null;
}
