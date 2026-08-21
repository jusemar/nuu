import type { VarianteFonteMerchant } from "../types/item-merchant";

export type AtributosVarianteMerchant = {
  color?: string;
  size?: string;
  material?: string;
  pattern?: string;
  variantOptions: Array<{ name: string; value: string }>;
};

export type MotivoGrupoVariantesMerchantInvalido =
  | "atributo_diferenciador_ausente"
  | "atributos_inconsistentes"
  | "combinacao_duplicada"
  | "grupo_sem_dimensao_suficiente";

export type ResultadoGrupoVariantesMerchant =
  | {
      valido: true;
      atributosPorVariante: Map<string, AtributosVarianteMerchant>;
    }
  | {
      valido: false;
      motivo: MotivoGrupoVariantesMerchantInvalido;
      detalhes: string;
    };

const campoGooglePorChave: Record<
  string,
  "color" | "size" | "material" | "pattern"
> = {
  cor: "color",
  color: "color",
  colour: "color",
  tamanho: "size",
  size: "size",
  material: "material",
  estampa: "pattern",
  padrao: "pattern",
  pattern: "pattern",
};

function normalizarChave(chave: string) {
  return chave
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function normalizarAtributos(atributos: Record<string, string>) {
  const resultado = new Map<string, { name: string; value: string }>();
  for (const [nomeBruto, valorBruto] of Object.entries(atributos)) {
    const name = nomeBruto.trim();
    const value = valorBruto.trim();
    const chave = normalizarChave(name);
    if (!name || !value || !chave || resultado.has(chave)) return null;
    resultado.set(chave, { name, value });
  }
  return resultado;
}

/**
 * Valida o grupo inteiro antes que qualquer item seja enviado. Somente
 * dimensões cujos valores realmente diferem entre as variantes são publicadas
 * como `variant_option`; atributos nunca são inventados para completar o grupo.
 */
export function validarGrupoVariantesMerchant(
  variantes: VarianteFonteMerchant[],
): ResultadoGrupoVariantesMerchant {
  const normalizados = variantes.map((variante) => ({
    id: variante.id,
    atributos: normalizarAtributos(variante.attributes),
  }));
  if (normalizados.some((item) => !item.atributos)) {
    return {
      valido: false,
      motivo: "atributos_inconsistentes",
      detalhes:
        "Há atributo vazio, duplicado após normalização ou sem nome válido.",
    };
  }

  const primeira = normalizados[0]?.atributos;
  if (!primeira || primeira.size === 0) {
    return {
      valido: false,
      motivo: "grupo_sem_dimensao_suficiente",
      detalhes: "As variantes não possuem atributos diferenciadores.",
    };
  }

  const chaves = [...primeira.keys()].sort();
  const todasAsChaves = new Set(
    normalizados.flatMap((item) => [...item.atributos!.keys()]),
  );
  for (const item of normalizados) {
    const ausentes = [...todasAsChaves].filter(
      (chave) => !item.atributos!.has(chave),
    );
    if (ausentes.length > 0) {
      return {
        valido: false,
        motivo: "atributo_diferenciador_ausente",
        detalhes: `A variante ${item.id} não possui: ${ausentes.join(", ")}.`,
      };
    }
  }

  const combinacoesCompletas = normalizados.map((item) =>
    chaves.map((chave) => item.atributos!.get(chave)!.value).join("\u0000"),
  );
  if (new Set(combinacoesCompletas).size !== combinacoesCompletas.length) {
    return {
      valido: false,
      motivo: "combinacao_duplicada",
      detalhes:
        "Duas ou mais variantes possuem a mesma combinação diferenciadora.",
    };
  }

  const chavesDiferenciadoras = chaves.filter((chave) => {
    const valores = normalizados.map(
      (item) => item.atributos!.get(chave)!.value,
    );
    return variantes.length === 1 || new Set(valores).size > 1;
  });
  if (chavesDiferenciadoras.length === 0) {
    return {
      valido: false,
      motivo: "grupo_sem_dimensao_suficiente",
      detalhes: "Nenhum atributo distingue as variantes elegíveis.",
    };
  }

  const nomesCanonicos = new Map(
    chavesDiferenciadoras.map((chave) => [chave, primeira.get(chave)!.name]),
  );
  const atributosPorVariante = new Map(
    normalizados.map((item) => {
      const variantOptions = chavesDiferenciadoras.map((chave) => ({
        name: nomesCanonicos.get(chave)!,
        value: item.atributos!.get(chave)!.value,
      }));
      const atributos: AtributosVarianteMerchant = { variantOptions };
      for (const chave of chavesDiferenciadoras) {
        const campo = campoGooglePorChave[chave];
        if (campo) atributos[campo] = item.atributos!.get(chave)!.value;
      }
      return [item.id, atributos];
    }),
  );
  return { valido: true, atributosPorVariante };
}

/** Atalho mantido para consumidores que precisam apenas do mapa validado. */
export function mapearAtributosGrupoVariantesMerchant(
  variantes: VarianteFonteMerchant[],
) {
  const resultado = validarGrupoVariantesMerchant(variantes);
  return resultado.valido
    ? resultado.atributosPorVariante
    : new Map<string, AtributosVarianteMerchant>();
}
