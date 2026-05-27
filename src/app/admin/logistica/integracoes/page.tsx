import { PaginaIntegracoesLogistica } from "@/features/admin/logistica/components/operacao/paginas-logistica-operacional";
import {
  listarProvedoresFrete,
  listarServicosFrete,
  listarTransportadorasFrete,
} from "@/features/admin/logistica/queries/frete";

export default async function IntegracoesLogisticaPage() {
  const [provedores, transportadoras, servicos] = await Promise.all([
    listarProvedoresFrete(),
    listarTransportadorasFrete(),
    listarServicosFrete(),
  ]);
  const frenet = provedores.find((provedor) => provedor.identificador.toLowerCase() === "frenet") ?? null;
  const cepOrigem = process.env.FRENET_CEP_ORIGEM?.replace(/\D/g, "") ?? "";
  const tokenConfigurado = Boolean(process.env.FRENET_TOKEN?.trim());
  const transportadorasFrenet = frenet
    ? transportadoras.filter((transportadora) => transportadora.provedorFreteId === frenet.id)
    : [];
  const servicosFrenet = frenet
    ? servicos.filter((servico) => servico.provedorFreteId === frenet.id)
    : [];
  const transportadorasEncontradas = transportadorasFrenet.map((transportadora) => ({
    id: transportadora.id,
    nome: transportadora.nome,
    servicos: servicosFrenet
      .filter((servico) => servico.transportadoraFreteId === transportadora.id)
      .map((servico) => servico.nome),
  }));
  const servicosSemTransportadora = servicosFrenet
    .filter((servico) => servico.transportadoraFreteId === null)
    .map((servico) => servico.nome);

  if (servicosSemTransportadora.length > 0) {
    transportadorasEncontradas.push({
      id: "sem-transportadora",
      nome: "Sem transportadora definida",
      servicos: servicosSemTransportadora,
    });
  }

  return (
    <PaginaIntegracoesLogistica
      integracoes={[
        {
          id: "frenet",
          nome: "Frenet",
          estado:
            frenet?.ativo && tokenConfigurado && cepOrigem.length === 8
              ? "conectado"
              : "nao-configurado",
          cepOrigem: cepOrigem.length === 8 ? cepOrigem : null,
          quantidadeServicosImportados: servicosFrenet.length,
          ultimaSincronizacao: null,
          ultimoTeste: null,
          transportadoras: transportadorasEncontradas,
          configuravel: true,
          permiteAtivacao: false,
        },
        {
          id: "melhor-envio",
          nome: "Melhor Envio",
          estado: "nao-configurado",
          cepOrigem: null,
          quantidadeServicosImportados: 0,
          ultimaSincronizacao: null,
          ultimoTeste: null,
          transportadoras: [],
          configuravel: false,
          permiteAtivacao: false,
        },
        {
          id: "enviocom",
          nome: "EnvioCom",
          estado: "nao-configurado",
          cepOrigem: null,
          quantidadeServicosImportados: 0,
          ultimaSincronizacao: null,
          ultimoTeste: null,
          transportadoras: [],
          configuravel: false,
          permiteAtivacao: false,
        },
      ]}
    />
  );
}
