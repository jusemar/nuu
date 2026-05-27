import type { OpcaoFrete } from "../../types/contratos-frete";
import type {
  ConfiguracaoDisponibilidadeFrete,
  LimitesGlobaisFrete,
  RegraDisponibilidadeFrete,
  ResultadoDisponibilidadeOpcaoFrete,
  ServicoDisponibilidadeFrete,
  TransportadoraDisponibilidadeFrete,
  VolumeDisponibilidadeFrete,
  VolumesDisponibilidadeFrete,
  ContextoProdutoDisponibilidadeFrete,
} from "../../types/disponibilidade-frete";

type DecisaoRegras = "sem-regra" | "permitido" | "bloqueado";

type AlvoDisponibilidadeFrete = {
  provedorIdentificador: string;
  transportadoraIdentificador: string | null;
  servicoIdentificador: string;
  servicoConhecido: boolean;
};

function normalizarIdentificador(valor: string | null | undefined) {
  return valor?.trim().toLocaleLowerCase("pt-BR") || null;
}

function obterTransportadoraOpcao(opcao: OpcaoFrete) {
  const transportadora = opcao.metadados?.transportadora;

  return typeof transportadora === "string"
    ? normalizarIdentificador(transportadora)
    : null;
}

function servicoDaOpcao(
  opcao: OpcaoFrete,
  servicos: ServicoDisponibilidadeFrete[],
) {
  const provedor = normalizarIdentificador(opcao.provedor);
  const servico = normalizarIdentificador(opcao.servico);

  return servicos.find(
    (servicoCadastrado) =>
      normalizarIdentificador(servicoCadastrado.provedorIdentificador) ===
        provedor &&
      normalizarIdentificador(servicoCadastrado.identificador) === servico,
  );
}

function transportadoraDaOpcao(
  opcao: OpcaoFrete,
  transportadoras: TransportadoraDisponibilidadeFrete[],
  servico: ServicoDisponibilidadeFrete | undefined,
) {
  const provedor = normalizarIdentificador(opcao.provedor);
  const identificadorServico = normalizarIdentificador(
    servico?.transportadoraIdentificador,
  );
  const transportadoraMetadados = obterTransportadoraOpcao(opcao);

  return transportadoras.find((transportadora) => {
    if (
      normalizarIdentificador(transportadora.provedorIdentificador) !== provedor
    ) {
      return false;
    }

    const identificador = normalizarIdentificador(transportadora.identificador);
    const nome = normalizarIdentificador(transportadora.nome);

    return (
      identificador === identificadorServico ||
      identificador === transportadoraMetadados ||
      nome === transportadoraMetadados
    );
  });
}

function obterVolumes({
  itens,
  pacotes,
}: VolumesDisponibilidadeFrete): VolumeDisponibilidadeFrete[] {
  if (pacotes.length > 0) {
    return pacotes.map((pacote) => ({
      pesoEmGramas: pacote.pesoTotalEmGramas,
      dimensoes: pacote.dimensoes,
    }));
  }

  return itens.map((item) => ({
    pesoEmGramas: item.pesoEmGramas * item.quantidade,
    dimensoes: item.dimensoes,
  }));
}

function excedePeso(volume: VolumeDisponibilidadeFrete, limite: number | null) {
  return limite !== null && volume.pesoEmGramas > limite;
}

function excedeDimensoes(
  volume: VolumeDisponibilidadeFrete,
  limites: LimitesGlobaisFrete,
) {
  const { dimensoes } = volume;

  return (
    (limites.alturaMaximaEmCm !== null &&
      limites.alturaMaximaEmCm !== undefined &&
      dimensoes.alturaEmCm > limites.alturaMaximaEmCm) ||
    (limites.larguraMaximaEmCm !== null &&
      limites.larguraMaximaEmCm !== undefined &&
      dimensoes.larguraEmCm > limites.larguraMaximaEmCm) ||
    (limites.comprimentoMaximoEmCm !== null &&
      limites.comprimentoMaximoEmCm !== undefined &&
      dimensoes.comprimentoEmCm > limites.comprimentoMaximoEmCm)
  );
}

function validarLimitesGlobais(
  limites: LimitesGlobaisFrete | undefined,
  volumes: VolumeDisponibilidadeFrete[],
) {
  if (!limites) {
    return null;
  }

  if (
    volumes.some((volume) =>
      excedePeso(volume, limites.pesoMaximoEmGramas ?? null),
    )
  ) {
    return "limite-global-peso" as const;
  }

  if (volumes.some((volume) => excedeDimensoes(volume, limites))) {
    return "limite-global-dimensoes" as const;
  }

  return null;
}

function regraAtiva(regra: RegraDisponibilidadeFrete) {
  return regra.ativo ?? true;
}

function regraEstaNoEscopo(
  regra: RegraDisponibilidadeFrete,
  alvo: AlvoDisponibilidadeFrete,
) {
  const provedorRegra = normalizarIdentificador(regra.provedorIdentificador);

  return !provedorRegra || provedorRegra === alvo.provedorIdentificador;
}

function regraCombinaComAlvo(
  regra: RegraDisponibilidadeFrete,
  alvo: AlvoDisponibilidadeFrete,
) {
  if (!regraEstaNoEscopo(regra, alvo)) {
    return false;
  }

  const transportadoraRegra = normalizarIdentificador(
    regra.transportadoraIdentificador,
  );
  const servicoRegra = normalizarIdentificador(regra.servicoIdentificador);

  if (
    transportadoraRegra &&
    transportadoraRegra !== alvo.transportadoraIdentificador
  ) {
    return false;
  }

  if (servicoRegra && servicoRegra !== alvo.servicoIdentificador) {
    return false;
  }

  return true;
}

function regraPermissaoRestringeOpcao(
  regra: RegraDisponibilidadeFrete,
  alvo: AlvoDisponibilidadeFrete,
) {
  if (!regraEstaNoEscopo(regra, alvo)) {
    return false;
  }

  // Frenet pode devolver servicos que ainda nao foram cadastrados.
  if (!alvo.servicoConhecido && regra.servicoIdentificador) {
    return false;
  }

  return true;
}

function decidirRegras(
  regras: RegraDisponibilidadeFrete[],
  alvo: AlvoDisponibilidadeFrete,
): DecisaoRegras {
  const regrasAtivas = regras.filter(regraAtiva);
  const bloqueios = regrasAtivas.filter(
    (regra) => regra.efeito === "bloquear" && regraCombinaComAlvo(regra, alvo),
  );

  if (bloqueios.length > 0) {
    return "bloqueado";
  }

  const permissoes = regrasAtivas.filter(
    (regra) =>
      regra.efeito === "permitir" && regraPermissaoRestringeOpcao(regra, alvo),
  );

  if (permissoes.length === 0) {
    return "sem-regra";
  }

  return permissoes.some((regra) => regraCombinaComAlvo(regra, alvo))
    ? "permitido"
    : "bloqueado";
}

function criarResultadoIndisponivel(
  opcao: OpcaoFrete,
  base: Pick<
    ResultadoDisponibilidadeOpcaoFrete,
    "servicoConhecido" | "transportadoraConhecida"
  >,
  motivo: NonNullable<ResultadoDisponibilidadeOpcaoFrete["motivo"]>,
): ResultadoDisponibilidadeOpcaoFrete {
  return {
    opcao,
    disponivel: false,
    motivo,
    ...base,
  };
}

function montarAlvoDisponibilidade(
  opcao: OpcaoFrete,
  servico: ServicoDisponibilidadeFrete | undefined,
  transportadora: TransportadoraDisponibilidadeFrete | undefined,
) {
  return {
    provedorIdentificador: normalizarIdentificador(opcao.provedor) ?? "",
    transportadoraIdentificador:
      normalizarIdentificador(transportadora?.identificador) ??
      obterTransportadoraOpcao(opcao),
    servicoIdentificador: normalizarIdentificador(opcao.servico) ?? "",
    servicoConhecido: Boolean(servico),
  } satisfies AlvoDisponibilidadeFrete;
}

export function resolverDisponibilidadeOpcaoFrete({
  opcao,
  contextoProduto,
  volumes,
  configuracao,
}: {
  opcao: OpcaoFrete;
  contextoProduto: ContextoProdutoDisponibilidadeFrete;
  volumes: VolumesDisponibilidadeFrete;
  configuracao: ConfiguracaoDisponibilidadeFrete;
}): ResultadoDisponibilidadeOpcaoFrete {
  const provedor = configuracao.provedores.find(
    (provedorCadastrado) =>
      normalizarIdentificador(provedorCadastrado.identificador) ===
      normalizarIdentificador(opcao.provedor),
  );
  const servico = servicoDaOpcao(opcao, configuracao.servicos);
  const transportadora = transportadoraDaOpcao(
    opcao,
    configuracao.transportadoras,
    servico,
  );
  const base = {
    servicoConhecido: Boolean(servico),
    transportadoraConhecida: Boolean(transportadora),
  };

  if (provedor && !provedor.ativo) {
    return criarResultadoIndisponivel(opcao, base, "provedor-inativo");
  }

  if (transportadora && !transportadora.ativo) {
    return criarResultadoIndisponivel(opcao, base, "transportadora-inativa");
  }

  if (servico && !servico.ativo) {
    return criarResultadoIndisponivel(opcao, base, "servico-inativo");
  }

  const volumesResolvidos = obterVolumes(volumes);
  const motivoLimiteTransportadora = validarLimitesGlobais(
    transportadora,
    volumesResolvidos,
  );

  if (motivoLimiteTransportadora) {
    return criarResultadoIndisponivel(opcao, base, motivoLimiteTransportadora);
  }

  const motivoLimiteServico = validarLimitesGlobais(servico, volumesResolvidos);

  if (motivoLimiteServico) {
    return criarResultadoIndisponivel(opcao, base, motivoLimiteServico);
  }

  const alvo = montarAlvoDisponibilidade(opcao, servico, transportadora);
  const decisaoProduto = decidirRegras(
    configuracao.regrasProdutos.filter(
      (regra) => regra.produtoId === contextoProduto.produtoId,
    ),
    alvo,
  );

  if (decisaoProduto === "bloqueado") {
    return criarResultadoIndisponivel(opcao, base, "regra-produto");
  }

  if (decisaoProduto === "permitido") {
    return { opcao, disponivel: true, ...base };
  }

  const decisaoClassificacao = decidirRegras(
    configuracao.regrasTiposLogisticos.filter((regra) =>
      contextoProduto.tiposLogisticosIdentificadores.includes(
        regra.tipoLogisticoIdentificador,
      ),
    ),
    alvo,
  );

  if (decisaoClassificacao === "bloqueado") {
    return criarResultadoIndisponivel(opcao, base, "regra-tipo-logistico");
  }

  if (decisaoClassificacao === "permitido") {
    return { opcao, disponivel: true, ...base };
  }

  if (contextoProduto.categoriaId) {
    const decisaoCategoria = decidirRegras(
      configuracao.regrasCategorias.filter(
        (regra) => regra.categoriaId === contextoProduto.categoriaId,
      ),
      alvo,
    );

    if (decisaoCategoria === "bloqueado") {
      return criarResultadoIndisponivel(opcao, base, "regra-categoria");
    }
  }

  return {
    opcao,
    disponivel: true,
    ...base,
  };
}

export function filtrarOpcoesFreteDisponiveis({
  opcoes,
  contextoProduto,
  volumes,
  configuracao,
}: {
  opcoes: OpcaoFrete[];
  contextoProduto: ContextoProdutoDisponibilidadeFrete;
  volumes: VolumesDisponibilidadeFrete;
  configuracao: ConfiguracaoDisponibilidadeFrete;
}) {
  return opcoes.filter((opcao) => {
    return resolverDisponibilidadeOpcaoFrete({
      opcao,
      contextoProduto,
      volumes,
      configuracao,
    }).disponivel;
  });
}
