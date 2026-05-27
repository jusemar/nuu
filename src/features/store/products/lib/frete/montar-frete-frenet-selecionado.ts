import type { OpcaoEntregaCotada } from "../../types/consulta-frete.types";

export function montarFreteFrenetSelecionado({
  opcao,
  cep,
}: {
  opcao: OpcaoEntregaCotada | null | undefined;
  cep: string;
}) {
  if (!opcao || opcao.provedor !== "frenet") {
    return undefined;
  }

  return {
    id: "frenet" as const,
    nome: opcao.nome,
    prazo: opcao.prazo || "Consulte prazo",
    valorEmCentavos: opcao.valorEmCentavos,
    cep,
    servico: opcao.servico,
  };
}
