import "dotenv/config";

import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import readline from "node:readline";
import type { Readable } from "node:stream";

import { db } from "@/db/connection";
import { shippingZipAddresses } from "@/db/table/logistics/entrega-propria";

type ZipAddressImportRow = {
  cep?: string;
  logradouro?: string;
  street?: string;
  complemento?: string;
  complement?: string;
  bairro?: string;
  neighborhood?: string;
  localidade?: string;
  city?: string;
  uf?: string;
  state?: string;
  ibge?: string;
  ibgeCode?: string;
};

const importFile = process.env.ZIP_ADDRESS_IMPORT_FILE;
const allowedStateInput = (process.env.ZIP_ADDRESS_IMPORT_STATE || "MG")
  .trim()
  .toUpperCase();
const allowedState = allowedStateInput === "ALL" ? null : allowedStateInput;
const allowedCitiesInput =
  process.env.ZIP_ADDRESS_IMPORT_CITIES || "Belo Horizonte,Contagem";
const allowedCities = allowedCitiesInput
  .split(",")
  .map((city) => normalize(city))
  .filter(Boolean);
const shouldImportAllCities = allowedCities.includes("all");
const zipPatterns = (
  process.env.ZIP_ADDRESS_IMPORT_ZIP_PATTERNS ||
  "v1/30*.json,v1/31*.json,v1/32*.json"
)
  .split(",")
  .map((pattern) => pattern.trim())
  .filter(Boolean);
const batchSize = Number(process.env.ZIP_ADDRESS_IMPORT_BATCH_SIZE || 100);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function mapRow(row: ZipAddressImportRow) {
  const cep = row.cep?.replace(/\D/g, "") || "";
  const neighborhood = (row.bairro || row.neighborhood || "").trim();
  const city = (row.localidade || row.city || "").trim();
  const state = (row.uf || row.state || "").trim().toUpperCase();

  if (
    cep.length !== 8 ||
    !neighborhood ||
    !city ||
    (allowedState && state !== allowedState) ||
    // Permite expansão por estado inteiro sem trocar o script a cada nova cidade.
    (!shouldImportAllCities && !allowedCities.includes(normalize(city)))
  ) {
    return null;
  }

  return {
    cep,
    street: (row.logradouro || row.street || "").trim(),
    complement: (row.complemento || row.complement || "").trim() || null,
    neighborhood,
    city,
    state,
    ibgeCode: (row.ibge || row.ibgeCode || "").trim() || null,
    source: "public-import",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsedAt: new Date(),
  };
}

async function flush(
  rows: NonNullable<ReturnType<typeof mapRow>>[],
  importedCount: number,
) {
  if (rows.length === 0) {
    return importedCount;
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await db
        .insert(shippingZipAddresses)
        .values(rows)
        .onConflictDoNothing({ target: shippingZipAddresses.cep });
      break;
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  return importedCount + rows.length;
}

async function* parseJsonObjects(stream: Readable) {
  let buffer = "";
  let depth = 0;
  let insideString = false;
  let escaped = false;

  for await (const chunk of stream) {
    const text = chunk.toString();

    for (const char of text) {
      if (char === "{" && !insideString && depth === 0) {
        buffer = "";
      }

      if (depth > 0 || char === "{") {
        buffer += char;
      }

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = insideString;
        continue;
      }

      if (char === '"') {
        insideString = !insideString;
        continue;
      }

      if (insideString) continue;

      if (char === "{") {
        depth += 1;
        continue;
      }

      if (char === "}") {
        depth -= 1;

        if (depth === 0 && buffer) {
          yield JSON.parse(buffer) as ZipAddressImportRow;
          buffer = "";
        }
      }
    }
  }
}

async function importFromZip(importFilePath: string) {
  const unzip = spawn("unzip", ["-p", importFilePath, ...zipPatterns], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const batch: NonNullable<ReturnType<typeof mapRow>>[] = [];
  let importedCount = 0;

  for await (const row of parseJsonObjects(unzip.stdout)) {
    const mapped = mapRow(row);
    if (!mapped) continue;

    batch.push(mapped);

    if (batch.length >= batchSize) {
      importedCount = await flush(batch.splice(0), importedCount);
      console.info(`CEPs importados ate agora: ${importedCount}`);
    }
  }

  importedCount = await flush(batch, importedCount);
  const [code] = (await once(unzip, "close")) as [number];

  if (code !== 0 && importedCount === 0) {
    throw new Error(`unzip finalizou com codigo ${code}.`);
  }

  return importedCount;
}

async function main() {
  if (!importFile) {
    throw new Error(
      "Informe ZIP_ADDRESS_IMPORT_FILE com o caminho do arquivo.",
    );
  }

  if (importFile.endsWith(".zip")) {
    const importedCount = await importFromZip(importFile);
    console.info(`Importacao finalizada. CEPs importados: ${importedCount}`);
    return;
  }

  const input = fs.createReadStream(importFile, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  const batch: NonNullable<ReturnType<typeof mapRow>>[] = [];
  let headers: string[] | null = null;
  let importedCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    const row = line.trim().startsWith("{")
      ? (JSON.parse(line) as ZipAddressImportRow)
      : (() => {
          const values = parseCsvLine(line);
          if (!headers) {
            headers = values.map((value) => value.trim());
            return null;
          }

          return headers.reduce<ZipAddressImportRow>((acc, header, index) => {
            acc[header as keyof ZipAddressImportRow] = values[index] || "";
            return acc;
          }, {});
        })();

    if (!row) continue;

    const mapped = mapRow(row);
    if (!mapped) continue;

    batch.push(mapped);

    if (batch.length >= batchSize) {
      importedCount = await flush(batch.splice(0), importedCount);
      console.info(`CEPs importados ate agora: ${importedCount}`);
    }
  }

  importedCount = await flush(batch, importedCount);
  console.info(`Importacao finalizada. CEPs importados: ${importedCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
