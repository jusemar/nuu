import "dotenv/config";

import { db } from "@/db/connection";
import {
  regioBairros,
  shippingRegionCepRanges,
  shippingRegions,
  shippingZipAddresses,
} from "@/db/table/logistics/entrega-propria";
import { gerarFaixasContiguasDeCeps } from "@/features/admin/logistics/entrega-propria/lib/cep-ranges";
import { and, eq, inArray } from "drizzle-orm";

type RegionSeed = {
  city: "Belo Horizonte" | "Contagem";
  name: string;
  neighborhoods: string[];
};

const TARGET_STATE = "MG";
const TARGET_CITIES = ["Belo Horizonte", "Contagem"];

const BH_REGIONS: RegionSeed[] = [
  {
    city: "Belo Horizonte",
    name: "Regional Barreiro",
    neighborhoods: [
      "Águas Claras",
      "Átila de Paiva",
      "Barreiro",
      "Bernadete",
      "Bonsucesso",
      "Brasil Industrial",
      "Cardoso",
      "Castanheira",
      "CDI Jatobá",
      "Conjunto Bonsucesso",
      "Conjunto Habitacional Vale do Jatobá",
      "Conjunto Jatobá",
      "Conjunto Túnel Ibirité",
      "Diamante",
      "Distrito Industrial do Jatobá",
      "Ernesto do Nascimento",
      "Esperança",
      "Flávio Marques Lisboa",
      "Flávio de Oliveira",
      "Independência",
      "Indústrias I",
      "Itaipu",
      "Jatobá",
      "João Paulo II",
      "Lindéia",
      "Mangueiras",
      "Milionários",
      "Miramar",
      "Novo Santa Cecília",
      "Novo das Indústrias",
      "Olaria",
      "Petrópolis",
      "Pongelupe",
      "Santa Cecília Vale do Jatobá",
      "Santa Cruz",
      "Santa Helena",
      "Santa Margarida",
      "Santa Rita",
      "Solar do Barreiro",
      "Teixeira Dias",
      "Tirol",
      "Vale do Jatobá",
      "Vila Bernadete",
      "Vila Ecológica",
      "Vila Formosa Vale do Jatobá",
      "Vila Itaipu",
      "Vila Petrópolis",
      "Vila Pinho Vale do Jatobá",
      "Vila Tirol",
      "Vitória da Conquista",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Centro-Sul",
    neighborhoods: [
      "Acaba Mundo",
      "Anchieta",
      "Barro Preto",
      "Belvedere",
      "Boa Viagem",
      "Carmo",
      "Centro",
      "Cidade Jardim",
      "Comiteco",
      "Cruzeiro",
      "Funcionários",
      "Lourdes",
      "Luxemburgo",
      "Mangabeiras",
      "Marçola",
      "Mala e Cuia",
      "Nossa Senhora Aparecida",
      "Nossa Senhora de Fátima",
      "Santa Efigênia",
      "Santa Lúcia",
      "Santa Rita de Cássia",
      "Santo Agostinho",
      "Santo Antônio",
      "Savassi",
      "Serra",
      "Serra do Curral",
      "Sion",
      "São Bento",
      "São Lucas",
      "São Pedro",
      "Vila Barragem Santa Lúcia",
      "Vila Paris",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Leste",
    neighborhoods: [
      "Alto Vera Cruz",
      "Baleia",
      "Boa Esperança",
      "Caetano Furquim",
      "Casa Branca",
      "Cidade Jardim Taquaril",
      "Conjunto Taquaril",
      "Esplanada",
      "Floresta",
      "Granja de Freitas",
      "Horto",
      "Horto Florestal",
      "Jonas Veiga",
      "Mariano de Abreu",
      "Nova Vista",
      "Paraíso",
      "Pompéia",
      "Santa Inês",
      "Santa Tereza",
      "Sagrada Família",
      "Saudade",
      "São Geraldo",
      "São Sebastião",
      "Taquaril",
      "Vera Cruz",
      "Vila Novo São Lucas",
      "Vila São Rafael",
      "Vista do Sol",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Nordeste",
    neighborhoods: [
      "Acaiaca",
      "Beija Flor",
      "Belmonte",
      "Boa Vista",
      "Cachoeirinha",
      "Capitão Eduardo",
      "Cidade Nova",
      "Colégio Batista",
      "Concórdia",
      "Dom Joaquim",
      "Dom Silvério",
      "Eymard",
      "Fernão Dias",
      "Goiânia",
      "Graça",
      "Ipiranga",
      "Ipê",
      "Jardim Vitória",
      "Maria Goretti",
      "Maria Virgínia",
      "Nazaré",
      "Nova Cachoeirinha",
      "Nova Floresta",
      "Palmares",
      "Paulo VI",
      "Pirajá",
      "Renascença",
      "Santa Cruz",
      "São Gabriel",
      "São Marcos",
      "São Paulo",
      "União",
      "Vila Maria",
      "Vitória",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Noroeste",
    neighborhoods: [
      "Alto Caiçaras",
      "Alípio de Melo",
      "Aparecida",
      "Aparecida Sétima Seção",
      "Bom Jesus",
      "Bonfim",
      "Caiçara-Adelaide",
      "Caiçaras",
      "Califórnia",
      "Carlos Prates",
      "Conjunto Califórnia",
      "Coqueiros",
      "Ermelinda",
      "Glória",
      "Inconfidência",
      "Jardim Alvorada",
      "Jardim Montanhês",
      "Jardim São José",
      "João Pinheiro",
      "Lagoinha",
      "Monsenhor Messias",
      "Nova Esperança",
      "Nova Gameleira",
      "Nova Granada",
      "Novo Glória",
      "Padre Eustáquio",
      "Pedreira Prado Lopes",
      "Pedro II",
      "Pindorama",
      "Santa Maria",
      "Santo André",
      "Senhor dos Passos",
      "Serrano",
      "São Cristóvão",
      "São Salvador",
      "Vila Jardim Alvorada",
      "Vila Sumaré",
      "Vila São José",
      "Vista Alegre",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Norte",
    neighborhoods: [
      "Aarão Reis",
      "Campo Alegre",
      "Etelvina Carneiro",
      "Floramar",
      "Frei Leopoldo",
      "Granja Werneck",
      "Guarani",
      "Heliópolis",
      "Jaqueline",
      "Jardim Felicidade",
      "Juliana",
      "Lajedo",
      "Maria Teresa",
      "Minaslândia",
      "Monte Azul",
      "Novo Aarão Reis",
      "Ouro Minas",
      "Planalto",
      "Primeiro de Maio",
      "Providência",
      "Ribeiro de Abreu",
      "São Bernardo",
      "Solimões",
      "Tupi A",
      "Tupi B",
      "Vila Cloris",
      "Vila Zilah Spósito",
      "Zilah Spósito",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Oeste",
    neighborhoods: [
      "Alpes",
      "Alto Barroca",
      "Alto dos Pinheiros",
      "Barroca",
      "Betânia",
      "Buritis",
      "Cabana do Pai Tomás",
      "Calafate",
      "Camargos",
      "Cinquentenário",
      "Conjunto Betânia",
      "Coração Eucarístico",
      "Coração de Jesus",
      "Delta",
      "Dom Bosco",
      "Dom Cabral",
      "Estoril",
      "Estrela do Oriente",
      "Gameleira",
      "Grajaú",
      "Gutierrez",
      "Havaí",
      "Jardim América",
      "Jardinópolis",
      "Leonina",
      "Madre Gertrudes",
      "Marajó",
      "Nova Cintra",
      "Nova Suíssa",
      "Olhos D'Água",
      "Palmeiras",
      "Prado",
      "Salgado Filho",
      "Santa Sofia",
      "São Jorge",
      "Sport Club",
      "Vila Calafate",
      "Vila Oeste",
      "Vila Vista Alegre",
      "Ventosa",
      "Virgínia",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Pampulha",
    neighborhoods: [
      "Aeroporto",
      "Bandeirantes",
      "Braúnas",
      "Campus UFMG",
      "Canadá",
      "Castelo",
      "Confisco",
      "Dona Clara",
      "Engenho Nogueira",
      "Garças",
      "Indaiá",
      "Itapoã",
      "Itatiaia",
      "Jaraguá",
      "Jardim Atlântico",
      "Liberdade",
      "Manacás",
      "Mineirão",
      "Ouro Preto",
      "Pampulha",
      "Paquetá",
      "Santa Amélia",
      "Santa Branca",
      "Santa Rosa",
      "São Francisco",
      "São José",
      "São Luiz",
      "Trevo",
      "Universitário",
      "Urca",
      "Vila Aeroporto",
    ],
  },
  {
    city: "Belo Horizonte",
    name: "Regional Venda Nova",
    neighborhoods: [
      "Apolônia",
      "Candelária",
      "Canaã",
      "Céu Azul",
      "Cenáculo",
      "Copacabana",
      "Europa",
      "Jardim dos Comerciários",
      "Jardim Leblon",
      "Jardim Pirineus",
      "Lagoa",
      "Lagoinha Leblon",
      "Letícia",
      "Mantiqueira",
      "Maria Helena",
      "Minascaixa",
      "Nova Pampulha",
      "Parque São Pedro",
      "Piratininga",
      "Rio Branco",
      "Santa Mônica",
      "Serra Verde",
      "São João Batista",
      "São Tomáz",
      "Venda Nova",
      "Vila Santa Branca",
      "Vila Santa Mônica",
    ],
  },
];

const CONTAGEM_REGIONS: RegionSeed[] = [
  {
    city: "Contagem",
    name: "Regional Eldorado",
    neighborhoods: [
      "Água Branca",
      "Bela Vista",
      "Cidade Jardim Eldorado",
      "Eldorado",
      "Glória",
      "Inconfidentes",
      "Jardim Bandeirantes",
      "Jardim Vera Cruz",
      "JK",
      "Novo Eldorado",
      "Parque São João",
      "Santa Cruz Industrial",
    ],
  },
  {
    city: "Contagem",
    name: "Regional Industrial",
    neighborhoods: [
      "Cidade Industrial",
      "Cinco",
      "Industrial",
      "Industrial Itaú",
      "Industrial Santa Cruz",
      "Industrial Santa Rita",
      "Industrial São Luiz",
      "Jardim Industrial",
      "Parque Belo Horizonte Industrial",
      "Santa Cruz Industrial",
    ],
  },
  {
    city: "Contagem",
    name: "Regional Nacional",
    neighborhoods: [
      "Arpoador",
      "Bandeirantes",
      "Caiapós",
      "Cabral",
      "Conjunto Confisco",
      "Conjunto Habitacional Nova Pampulha",
      "Estrela Dalva",
      "Nacional",
      "Parque Xangri-Lá",
      "Pedra Azul",
      "São Mateus",
      "Tupã",
      "Vila Pérola",
    ],
  },
  {
    city: "Contagem",
    name: "Regional Petrolândia",
    neighborhoods: [
      "Campo Alto",
      "Campina Verde",
      "Carajás",
      "Europa",
      "Jardim Marrocos",
      "Jardim Pérola",
      "Petrolândia",
      "Sapucaia",
      "Sapucaia II",
      "Sapucaias III",
      "Tropical",
      "Vila São Paulo",
    ],
  },
  {
    city: "Contagem",
    name: "Regional Ressaca",
    neighborhoods: [
      "Arvoredo",
      "Arvoredo 2ª Seção",
      "Cabral",
      "Chácara Contagem",
      "Kennedy",
      "Kennedy (Ceasa)",
      "Morada Nova",
      "Novo Progresso",
      "Oitis",
      "Parque Recreio",
      "Parque Turistas",
      "Ressaca",
    ],
  },
  {
    city: "Contagem",
    name: "Regional Riacho",
    neighborhoods: [
      "Amazonas",
      "Flamengo",
      "Jardim Riacho das Pedras",
      "Novo Riacho",
      "Parque Riacho das Pedras",
      "Parque Riacho das Pedras 2ª Seção",
      "Riacho das Pedras",
      "Zonas Industriais do Riacho",
    ],
  },
  {
    city: "Contagem",
    name: "Regional Sede",
    neighborhoods: [
      "Bernardo Monteiro",
      "Centro",
      "Fonte Grande",
      "Funcionários",
      "Maria da Conceição",
      "Nossa Senhora do Carmo",
      "Santa Helena",
      "São Gonçalo",
      "Sede",
      "Vila Militar",
    ],
  },
  {
    city: "Contagem",
    name: "Regional Vargem das Flores",
    neighborhoods: [
      "Darcy Ribeiro",
      "Estaleiro",
      "Estâncias Imperiais",
      "Icaivera",
      "Nova Contagem",
      "Retiro",
      "Retiro dos Sonhos",
      "Solar do Madeira",
      "Vale das Amendoeiras",
      "Vale das Orquídeas",
    ],
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[ªº]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutParentheses(value: string) {
  return normalize(value.replace(/\s*\(.+?\)\s*/g, " "));
}

function buildRegionLookup(seeds: RegionSeed[]) {
  const lookup = new Map<string, RegionSeed>();

  seeds.forEach((seed) => {
    seed.neighborhoods.forEach((neighborhood) => {
      lookup.set(normalize(neighborhood), seed);
      lookup.set(withoutParentheses(neighborhood), seed);
    });
  });

  return lookup;
}

function getRegionFromNeighborhood(
  neighborhood: string,
  city: "Belo Horizonte" | "Contagem",
  lookup: Map<string, RegionSeed>,
) {
  const directRegion = lookup.get(normalize(neighborhood));
  if (directRegion) return directRegion;

  const baseRegion = lookup.get(withoutParentheses(neighborhood));
  if (baseRegion) return baseRegion;

  if (city === "Belo Horizonte") {
    const normalized = normalize(neighborhood);

    if (normalized.includes("(barreiro)")) {
      return BH_REGIONS.find((region) => region.name === "Regional Barreiro");
    }

    if (normalized.includes("(venda nova)")) {
      return BH_REGIONS.find((region) => region.name === "Regional Venda Nova");
    }

    if (normalized.includes("(pampulha)")) {
      return BH_REGIONS.find((region) => region.name === "Regional Pampulha");
    }
  }

  return null;
}

async function createCepRanges(
  regionId: number,
  city: string,
  bairros: string[],
) {
  if (bairros.length === 0) return 0;

  const ceps = await db.query.shippingZipAddresses.findMany({
    where: and(
      eq(shippingZipAddresses.state, TARGET_STATE),
      eq(shippingZipAddresses.city, city),
      inArray(shippingZipAddresses.neighborhood, bairros),
    ),
    columns: {
      cep: true,
    },
  });
  const ranges = gerarFaixasContiguasDeCeps(ceps.map((item) => item.cep));

  for (let index = 0; index < ranges.length; index += 500) {
    await db.insert(shippingRegionCepRanges).values(
      ranges.slice(index, index + 500).map((range) => ({
        regionId,
        cepStart: range.cepStart,
        cepEnd: range.cepEnd,
        source: "auto",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }

  return ranges.length;
}

async function main() {
  const seeds = [...BH_REGIONS, ...CONTAGEM_REGIONS];
  const lookup = buildRegionLookup(seeds);

  await db
    .delete(shippingRegions)
    .where(
      and(
        eq(shippingRegions.state, TARGET_STATE),
        inArray(shippingRegions.city, TARGET_CITIES),
      ),
    );

  const addresses = await db.query.shippingZipAddresses.findMany({
    where: and(
      eq(shippingZipAddresses.state, TARGET_STATE),
      inArray(shippingZipAddresses.city, TARGET_CITIES),
    ),
    columns: {
      city: true,
      neighborhood: true,
    },
  });
  const uniqueNeighborhoods = Array.from(
    new Set(
      addresses.map((address) => `${address.city}|||${address.neighborhood}`),
    ),
  ).map((value) => {
    const [city, neighborhood] = value.split("|||") as [
      "Belo Horizonte" | "Contagem",
      string,
    ];
    return { city, neighborhood };
  });
  const neighborhoodsByRegion = new Map<string, Set<string>>();
  const unmapped: { city: string; neighborhood: string }[] = [];

  seeds.forEach((seed) => {
    neighborhoodsByRegion.set(`${seed.city}|||${seed.name}`, new Set());
  });

  uniqueNeighborhoods.forEach(({ city, neighborhood }) => {
    const region = getRegionFromNeighborhood(neighborhood, city, lookup);

    if (!region) {
      unmapped.push({ city, neighborhood });
      return;
    }

    neighborhoodsByRegion
      .get(`${region.city}|||${region.name}`)
      ?.add(neighborhood);
  });

  const summary: {
    city: string;
    region: string;
    neighborhoods: number;
    cepRanges: number;
  }[] = [];

  for (const seed of seeds) {
    const [region] = await db
      .insert(shippingRegions)
      .values({
        name: seed.name,
        description:
          "Cobertura inicial criada a partir das regionais oficiais e da base local de CEPs.",
        city: seed.city,
        state: TARGET_STATE,
        baseShippingPrice: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const bairros = Array.from(
      neighborhoodsByRegion.get(`${seed.city}|||${seed.name}`) ?? [],
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    if (bairros.length > 0) {
      await db.insert(regioBairros).values(
        bairros.map((bairro) => ({
          regiaoId: region.id,
          neighborhood: bairro,
        })),
      );
    }

    const cepRanges = await createCepRanges(region.id, seed.city, bairros);

    summary.push({
      city: seed.city,
      region: seed.name,
      neighborhoods: bairros.length,
      cepRanges,
    });
  }

  console.table(summary);
  console.info(
    `Bairros sem regional automatica: ${unmapped.length}. Eles continuam na base local, mas nao viraram cobertura atendida.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
