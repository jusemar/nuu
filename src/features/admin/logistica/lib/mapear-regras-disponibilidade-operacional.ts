export type RegraDisponibilidadeOperacional = {
  id: string;
  nome: string;
  ativo: boolean;
  frase: string;
  alvo: string;
  efeito: "permitir" | "bloquear";
  servicoAfetado: string;
  precedencia: string;
};

type TipoAlvoRegra = "categoria" | "produto" | "classificacao";

type DadosRegra = {
  id: string;
  efeito: string;
  ativo: boolean;
  provedorNome: string | null;
  transportadoraNome: string | null;
  servicoNome: string | null;
};

function textoEfeito(efeito: string) {
  return efeito === "permitir" ? "Permitir" : "Bloquear";
}

function servicoAfetado(regra: DadosRegra) {
  if (regra.transportadoraNome && regra.servicoNome) {
    if (regra.servicoNome.toLowerCase().includes(regra.transportadoraNome.toLowerCase())) {
      return regra.servicoNome;
    }
    return `${regra.transportadoraNome} ${regra.servicoNome}`;
  }
  return regra.servicoNome ?? regra.transportadoraNome ?? regra.provedorNome ?? "todos os serviços";
}

function rotuloAlvo(tipo: TipoAlvoRegra) {
  if (tipo === "categoria") return "categoria";
  if (tipo === "produto") return "produto";
  return "classificação";
}

function precedencia(tipo: TipoAlvoRegra) {
  if (tipo === "produto") return "Sobrescreve categoria";
  if (tipo === "categoria") return "Base da categoria";
  return "Aplicada ao grupo";
}

export function mapearRegraDisponibilidadeOperacional(
  regra: DadosRegra,
  tipo: TipoAlvoRegra,
  alvo: string,
): RegraDisponibilidadeOperacional {
  const efeito = regra.efeito === "permitir" ? "permitir" : "bloquear";
  const servico = servicoAfetado(regra);

  return {
    id: regra.id,
    nome: alvo,
    ativo: regra.ativo,
    alvo,
    efeito,
    servicoAfetado: servico,
    precedencia: precedencia(tipo),
    frase: `${textoEfeito(efeito)} ${servico} para ${rotuloAlvo(tipo)} ${alvo}`,
  };
}
