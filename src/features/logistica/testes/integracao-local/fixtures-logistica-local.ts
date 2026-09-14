import { Client } from "pg";

/**
 * Fixtures do PostgreSQL LOCAL para os testes de integração da logística
 * (Frete Externo + Entrega Própria por Categoria). Nenhum dado real é usado:
 * a geografia representa Belo Horizonte e quatro regiões, e os produtos
 * reproduzem as condições dos cenários (inclusive fornecedor tipo Laquila).
 */

export const IDS = {
  marca: "10000000-0000-4000-8000-000000000001",
  modeloRetirada: "10000000-0000-4000-8000-000000000002",
  fornecedor: "10000000-0000-4000-8000-000000000003",
  catalogo: {
    provedorFrenet: "50000000-0000-4000-8000-000000000001",
    correios: "50000000-0000-4000-8000-000000000002",
    jadlog: "50000000-0000-4000-8000-000000000003",
    pac: "50000000-0000-4000-8000-000000000004",
    sedex: "50000000-0000-4000-8000-000000000005",
    jadlogPackage: "50000000-0000-4000-8000-000000000006",
    tipoFragil: "50000000-0000-4000-8000-000000000007",
  },
  categorias: {
    pet: "20000000-0000-4000-8000-000000000001",
    racoes: "20000000-0000-4000-8000-000000000002",
    racoesPremium: "20000000-0000-4000-8000-000000000003",
    moto: "20000000-0000-4000-8000-000000000004",
    capacetes: "20000000-0000-4000-8000-000000000005",
    informatica: "20000000-0000-4000-8000-000000000006",
    hdInterno: "20000000-0000-4000-8000-000000000007",
  },
  produtos: {
    /** Loja, "Rações Premium", sem preço próprio: herda da categoria. */
    racao: "30000000-0000-4000-8000-000000000001",
    /** Loja, "Rações Premium", com preço próprio BH R$ 7,00. */
    racaoComPreco: "30000000-0000-4000-8000-000000000002",
    /** Loja, "Capacetes". */
    capaceteLoja: "30000000-0000-4000-8000-000000000003",
    /** Fornecedor tipo Laquila, entrega do fornecedor (como CAP-GENE-862). */
    capaceteFornecedorGene: "30000000-0000-4000-8000-000000000004",
    /** Fornecedor tipo Laquila, legado com "own" (como CAP-TEXX-653). */
    capaceteFornecedorTexx: "30000000-0000-4000-8000-000000000005",
    /** Loja, "HD Interno", com retirada. */
    hd: "30000000-0000-4000-8000-000000000006",
  },
  variantes: {
    racao: "40000000-0000-4000-8000-000000000001",
    racaoComPreco: "40000000-0000-4000-8000-000000000002",
    capaceteLoja: "40000000-0000-4000-8000-000000000003",
    capaceteFornecedorGene: "40000000-0000-4000-8000-000000000004",
    capaceteFornecedorTexx: "40000000-0000-4000-8000-000000000005",
    hd: "40000000-0000-4000-8000-000000000006",
  },
} as const;

/** CEPs e o nível geográfico que cada um deve resolver. */
export const CEPS = {
  /** Faixa da Região Barreiro. */
  barreiro: { cep: "30610000", bairro: "Indústrias I", nivel: "regiao" },
  /** CEP específico dentro da faixa do Barreiro (CEP vence Região). */
  cepEspecificoBarreiro: {
    cep: "30668635",
    bairro: "Santa Rita",
    nivel: "cep",
  },
  /** Faixa da Região Pampulha (tem agenda própria). */
  pampulha: { cep: "31270901", bairro: "Pampulha", nivel: "regiao" },
  /** Faixa da Região Oeste (herda a agenda de Belo Horizonte). */
  oeste: { cep: "30110059", bairro: "Gutierrez", nivel: "regiao" },
  /** Faixa da Região Noroeste. */
  noroeste: { cep: "30431262", bairro: "Nova Granada", nivel: "regiao" },
  /** Bairro cadastrado sem região e fora das faixas. */
  bairroSantaEfigenia: {
    cep: "30150000",
    bairro: "Santa Efigênia",
    nivel: "bairro",
  },
  /** Só a cidade (sem faixa, bairro ou CEP específico). */
  centro: { cep: "30190000", bairro: "Centro", nivel: "cidade" },
} as const;

export type ChaveCep = keyof typeof CEPS;

export type IdsGeograficos = {
  bh: number;
  regioes: {
    barreiro: number;
    pampulha: number;
    oeste: number;
    noroeste: number;
  };
  bairroSantaEfigenia: number;
  cepEspecificoBarreiro: number;
};

type Executor = Pick<Client, "query">;

async function inserirId(
  executor: Executor,
  sql: string,
  valores: unknown[],
): Promise<number> {
  const resultado = await executor.query<{ id: number }>(
    `${sql} RETURNING id`,
    valores,
  );
  const id = resultado.rows[0]?.id;
  if (typeof id !== "number") throw new Error("Fixture sem id retornado.");
  return id;
}

/** Cria toda a base local. Deve rodar num banco recém-migrado e vazio. */
export async function criarFixturesLogisticaLocal(
  executor: Executor,
): Promise<IdsGeograficos> {
  await executor.query(
    "INSERT INTO states (uf, name, is_active) VALUES ('MG', 'Minas Gerais', true)",
  );
  const bh = await inserirId(
    executor,
    "INSERT INTO cities (name, state_uf, is_active) VALUES ('Belo Horizonte', 'MG', true)",
    [],
  );

  const regiao = (nome: string) =>
    inserirId(
      executor,
      "INSERT INTO shipping_regions (name, city, state, city_id, is_active) VALUES ($1, 'Belo Horizonte', 'MG', $2, true)",
      [nome, bh],
    );
  const regioes = {
    barreiro: await regiao("Barreiro"),
    pampulha: await regiao("Pampulha"),
    oeste: await regiao("Oeste"),
    noroeste: await regiao("Noroeste"),
  };
  const faixas: Array<[number, string, string]> = [
    [regioes.barreiro, "30600000", "30699999"],
    [regioes.pampulha, "31270000", "31279999"],
    [regioes.oeste, "30110000", "30119999"],
    [regioes.noroeste, "30430000", "30439999"],
  ];
  for (const [regiaoId, inicio, fim] of faixas) {
    await executor.query(
      "INSERT INTO shipping_region_cep_ranges (region_id, cep_start, cep_end, is_active) VALUES ($1, $2, $3, true)",
      [regiaoId, inicio, fim],
    );
  }

  const bairroSantaEfigenia = await inserirId(
    executor,
    "INSERT INTO bairros_entrega_propria (nome, nome_normalizado, cidade_id, ativo) VALUES ('Santa Efigênia', 'santa efigenia', $1, true)",
    [bh],
  );
  const cepEspecificoBarreiro = await inserirId(
    executor,
    "INSERT INTO ceps_especificos (cep, neighborhood, city, state, is_active) VALUES ('30668635', 'Santa Rita', 'Belo Horizonte', 'MG', true)",
    [],
  );

  // Cache de endereços: evita qualquer consulta externa ao ViaCEP.
  for (const { cep, bairro } of Object.values(CEPS)) {
    await executor.query(
      "INSERT INTO shipping_zip_addresses (cep, street, neighborhood, city, state, source) VALUES ($1, 'Rua Fixture', $2, 'Belo Horizonte', 'MG', 'fixture')",
      [cep, bairro],
    );
  }

  // Agenda Geográfica: BH Seg/Qua/Sex 13:00; Pampulha tem agenda própria.
  await executor.query(
    "INSERT INTO agendas_geograficas_entrega_propria (tipo_destino, cidade_id, dias_atendidos, horario_corte, ativa) VALUES ('cidade', $1, '{1,3,5}', '13:00', true)",
    [bh],
  );
  await executor.query(
    "INSERT INTO agendas_geograficas_entrega_propria (tipo_destino, regiao_id, dias_atendidos, horario_corte, ativa) VALUES ('regiao', $1, '{2,4}', '11:00', true)",
    [regioes.pampulha],
  );

  await executor.query(
    // "generico" é a marca padrão exigida pelas actions de produto do Admin.
    "INSERT INTO marca (id, nome, slug, ativo) VALUES ($1, 'Genérico', 'generico', true)",
    [IDS.marca],
  );
  await executor.query(
    "INSERT INTO modelos_retirada (id, nome, prazo_texto, ativo) VALUES ($1, 'Retirada na loja', 'Retire em 1 dia útil', true)",
    [IDS.modeloRetirada],
  );

  const categorias: Array<[string, string, string | null]> = [
    [IDS.categorias.pet, "Pet Shop", null],
    [IDS.categorias.racoes, "Rações", IDS.categorias.pet],
    [IDS.categorias.racoesPremium, "Rações Premium", IDS.categorias.racoes],
    [IDS.categorias.moto, "Moto Peças", null],
    [IDS.categorias.capacetes, "Capacetes", IDS.categorias.moto],
    [IDS.categorias.informatica, "Informática", null],
    [IDS.categorias.hdInterno, "HD Interno", IDS.categorias.informatica],
  ];
  for (const [id, nome, parentId] of categorias) {
    await executor.query(
      "INSERT INTO category (id, name, slug, parent_id, is_active) VALUES ($1, $2, $3, $4, true)",
      [id, nome, `fixture-${id.slice(-4)}`, parentId],
    );
  }

  const produtos: Array<{
    id: string;
    variante: string;
    categoria: string;
    nome: string;
    tipos: string[];
    permiteEntregaPropriaLegado: boolean;
    retirada?: boolean;
  }> = [
    {
      id: IDS.produtos.racao,
      variante: IDS.variantes.racao,
      categoria: IDS.categorias.racoesPremium,
      nome: "Ração Fixture",
      tipos: ["own"],
      permiteEntregaPropriaLegado: false,
    },
    {
      id: IDS.produtos.racaoComPreco,
      variante: IDS.variantes.racaoComPreco,
      categoria: IDS.categorias.racoesPremium,
      nome: "Ração com Preço Próprio",
      tipos: ["own"],
      permiteEntregaPropriaLegado: true,
    },
    {
      id: IDS.produtos.capaceteLoja,
      variante: IDS.variantes.capaceteLoja,
      categoria: IDS.categorias.capacetes,
      nome: "Capacete da Loja",
      tipos: ["own"],
      permiteEntregaPropriaLegado: false,
    },
    {
      id: IDS.produtos.capaceteFornecedorGene,
      variante: IDS.variantes.capaceteFornecedorGene,
      categoria: IDS.categorias.capacetes,
      nome: "Capacete Fornecedor (supplier)",
      tipos: ["supplier"],
      permiteEntregaPropriaLegado: false,
    },
    {
      id: IDS.produtos.capaceteFornecedorTexx,
      variante: IDS.variantes.capaceteFornecedorTexx,
      categoria: IDS.categorias.capacetes,
      nome: "Capacete Fornecedor (legado own)",
      tipos: ["own"],
      permiteEntregaPropriaLegado: false,
    },
    {
      id: IDS.produtos.hd,
      variante: IDS.variantes.hd,
      categoria: IDS.categorias.hdInterno,
      nome: "HD Fixture",
      tipos: ["own"],
      permiteEntregaPropriaLegado: false,
      retirada: true,
    },
  ];
  for (const produto of produtos) {
    await executor.query(
      `INSERT INTO product (id, category_id, name, slug, description, marca_id, sku,
         product_kind, status, is_active, weight_in_grams, height_in_cm, width_in_cm, length_in_cm,
         allowed_delivery_types, allows_own_delivery, allows_pickup, modelo_retirada_id)
       VALUES ($1, $2, $3, $4, 'Produto de fixture', $5, $6, 'simple', 'published', true, 1200, 10, 20, 30,
         $7, $8, $9, $10)`,
      [
        produto.id,
        produto.categoria,
        produto.nome,
        `fixture-produto-${produto.id.slice(-4)}`,
        IDS.marca,
        `FIX-${produto.id.slice(-4)}`,
        produto.tipos,
        produto.permiteEntregaPropriaLegado,
        produto.retirada === true,
        produto.retirada ? IDS.modeloRetirada : null,
      ],
    );
    await executor.query(
      `INSERT INTO product_variant (id, product_id, sku, price_in_cents, stock_quantity,
         is_active, is_default, weight_in_grams, height_in_cm, width_in_cm, length_in_cm)
       VALUES ($1, $2, $3, 10000, 50, true, true, 1200, 10, 20, 30)`,
      [produto.variante, produto.id, `FIX-${produto.id.slice(-4)}`],
    );
    await executor.query(
      "INSERT INTO product_pricing (product_id, type, price_in_cents, main_card_price, is_active) VALUES ($1, 'stock', 10000, true, true)",
      [produto.id],
    );
  }

  // Fornecedor com integração tipo Laquila e vínculos ativos. A decisão do
  // motor usa o vínculo/origem de expedição — nunca o SKU.
  await executor.query(
    "INSERT INTO fornecedores (id, nome, tipo_integracao) VALUES ($1, 'Fornecedor Fixture', 'api')",
    [IDS.fornecedor],
  );
  await executor.query(
    "INSERT INTO fornecedor_integracoes_api (fornecedor_id, provedor, ambiente, cnpj_empresa, ativo) VALUES ($1, 'laquila', 'homologacao', '00000000000000', true)",
    [IDS.fornecedor],
  );
  for (const produtoId of [
    IDS.produtos.capaceteFornecedorGene,
    IDS.produtos.capaceteFornecedorTexx,
  ]) {
    await executor.query(
      "INSERT INTO fornecedor_produto_vinculos (fornecedor_id, produto_id, codigo_fornecedor, status) VALUES ($1, $2, $3, 'ativo')",
      [IDS.fornecedor, produtoId, `COD-${produtoId.slice(-4)}`],
    );
  }

  // Catálogo de frete externo (Frenet) usado pelas regras específicas.
  const catalogo = IDS.catalogo;
  await executor.query(
    "INSERT INTO provedores_frete (id, identificador, nome, ativo) VALUES ($1, 'frenet', 'Frenet', true)",
    [catalogo.provedorFrenet],
  );
  await executor.query(
    `INSERT INTO transportadoras_frete (id, provedor_frete_id, identificador, nome, ativo)
     VALUES ($1, $3, 'correios', 'Correios', true), ($2, $3, 'jadlog', 'Jadlog', true)`,
    [catalogo.correios, catalogo.jadlog, catalogo.provedorFrenet],
  );
  await executor.query(
    `INSERT INTO servicos_frete (id, provedor_frete_id, transportadora_frete_id, identificador, nome, ativo)
     VALUES ($1, $4, $5, '03298', 'PAC', true), ($2, $4, $5, '03220', 'SEDEX', true),
            ($3, $4, $6, '.package', '.Package', true)`,
    [
      catalogo.pac,
      catalogo.sedex,
      catalogo.jadlogPackage,
      catalogo.provedorFrenet,
      catalogo.correios,
      catalogo.jadlog,
    ],
  );
  await executor.query(
    "INSERT INTO tipos_logisticos (id, identificador, nome, ativo) VALUES ($1, 'fragil', 'Frágil', true)",
    [catalogo.tipoFragil],
  );

  return {
    bh,
    regioes,
    bairroSantaEfigenia,
    cepEspecificoBarreiro,
  };
}

type Modo = "herdar" | "ativado" | "desativado";

export type CondicaoEntregaPropria = {
  tipo: "cidade" | "region" | "bairro" | "cep-especifico";
  destinoId: number;
  rapidaEmCentavos: number;
  rapidaAtiva?: boolean;
  prazo?: string | null;
  programada?: { janelas: number; valorEmCentavos: number } | null;
  ativo?: boolean;
};

function colunaDestino(tipo: CondicaoEntregaPropria["tipo"]) {
  return {
    cidade: "city_id",
    region: "region_id",
    bairro: "bairro_id",
    "cep-especifico": "cep_especifico_id",
  }[tipo];
}

/** Grava condições de Entrega Própria numa Categoria ou num Produto. */
export async function definirCondicoesEntregaPropria(
  executor: Executor,
  alvo: { categoriaId: string } | { produtoId: string },
  condicoes: CondicaoEntregaPropria[],
) {
  const [tabela, coluna, id] =
    "categoriaId" in alvo
      ? ["category_own_delivery_prices", "category_id", alvo.categoriaId]
      : ["product_own_delivery_prices", "product_id", alvo.produtoId];
  await executor.query(`DELETE FROM ${tabela} WHERE ${coluna} = $1`, [id]);
  for (const condicao of condicoes) {
    await executor.query(
      `INSERT INTO ${tabela} (${coluna}, destination_type, ${colunaDestino(condicao.tipo)},
         shipping_price, rapid_delivery_active, delivery_deadline,
         scheduled_delivery_active, scheduled_delivery_min_days, scheduled_delivery_price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        condicao.tipo,
        condicao.destinoId,
        condicao.rapidaEmCentavos,
        condicao.rapidaAtiva ?? true,
        condicao.prazo ?? null,
        Boolean(condicao.programada),
        condicao.programada?.janelas ?? null,
        condicao.programada?.valorEmCentavos ?? null,
        condicao.ativo ?? true,
      ],
    );
  }
}

export async function definirModosCategoria(
  executor: Executor,
  categoriaId: string,
  modos: { entregaPropria?: Modo; freteExterno?: Modo },
) {
  if (modos.entregaPropria) {
    await executor.query(
      "UPDATE category SET disponibilidade_entrega_propria = $1 WHERE id = $2",
      [modos.entregaPropria, categoriaId],
    );
  }
  if (modos.freteExterno) {
    await executor.query(
      "UPDATE category SET disponibilidade_frete_externo = $1 WHERE id = $2",
      [modos.freteExterno, categoriaId],
    );
  }
}

export async function definirModosProduto(
  executor: Executor,
  produtoId: string,
  modos: { entregaPropria?: Modo | null; freteExterno?: Modo },
) {
  if (modos.entregaPropria !== undefined) {
    await executor.query(
      "UPDATE product SET disponibilidade_entrega_propria = $1 WHERE id = $2",
      [modos.entregaPropria, produtoId],
    );
  }
  if (modos.freteExterno) {
    await executor.query(
      "UPDATE product SET disponibilidade_frete_externo = $1 WHERE id = $2",
      [modos.freteExterno, produtoId],
    );
  }
}

/** Volta todas as categorias/produtos ao estado inicial entre cenários. */
export async function restaurarEstadoInicial(executor: Executor) {
  await executor.query("DELETE FROM category_own_delivery_prices");
  await executor.query("DELETE FROM product_own_delivery_prices");
  await executor.query("DELETE FROM regras_produtos_frete");
  await executor.query("DELETE FROM regras_categorias_frete");
  await executor.query("DELETE FROM regras_tipos_logisticos_frete");
  await executor.query("DELETE FROM produtos_tipos_logisticos");
  await executor.query(
    "UPDATE category SET disponibilidade_entrega_propria = 'herdar', disponibilidade_frete_externo = 'herdar'",
  );
  await executor.query(
    "UPDATE product SET disponibilidade_entrega_propria = NULL, disponibilidade_frete_externo = 'herdar'",
  );
}
