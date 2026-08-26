export const ambientesLaquila = ["homologacao", "producao"] as const;

export type AmbienteLaquila = (typeof ambientesLaquila)[number];

const origensApiLaquila: Record<AmbienteLaquila, string> = {
  homologacao: "https://hom-api-dropshipping.laquila.com.br",
  producao: "https://api-dropshipping.laquila.com.br",
};

export function obterAmbienteAplicacaoLaquila(
  valor = process.env.APP_ENVIRONMENT,
): AmbienteLaquila {
  if (valor === "homologacao" || valor === "producao") return valor;

  throw new Error(
    "APP_ENVIRONMENT deve ser configurado explicitamente como homologacao ou producao.",
  );
}

export function validarAmbienteLaquilaAplicacao(
  ambiente: AmbienteLaquila,
  ambienteAplicacao = obterAmbienteAplicacaoLaquila(),
) {
  if (ambiente !== ambienteAplicacao) {
    throw new Error(
      `Operação Laquila bloqueada: aplicação ${ambienteAplicacao} não pode usar configuração ${ambiente}.`,
    );
  }

  return ambiente;
}

/** Valida o host canônico sem reconstruir ou expor o token presente na rota. */
export function resolverUrlBaseLaquila(
  ambiente: AmbienteLaquila,
  urlBaseConfigurada: string | null,
) {
  validarAmbienteLaquilaAplicacao(ambiente);

  if (!urlBaseConfigurada?.trim()) {
    throw new Error(`URL da Laquila não configurada para ${ambiente}.`);
  }

  const url = new URL(urlBaseConfigurada.trim());
  const origemEsperada = origensApiLaquila[ambiente];

  if (url.protocol !== "https:" || url.origin !== origemEsperada) {
    throw new Error(
      `URL Laquila incompatível com o ambiente ${ambiente}. Não existe fallback automático.`,
    );
  }

  return url.toString();
}

export function obterOrigemApiLaquila(ambiente: AmbienteLaquila) {
  return origensApiLaquila[ambiente];
}
