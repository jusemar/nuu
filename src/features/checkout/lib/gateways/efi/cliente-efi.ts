import https from "node:https";

import { obterConfiguracaoEfi } from "./configuracao-efi";

type MetodoHttpEfi = "GET" | "POST" | "PUT" | "PATCH";

type RequestJsonEfiParams = {
  metodo: MetodoHttpEfi;
  path: string;
  authorization?: string;
  body?: unknown;
};

type TokenEfiResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
};

function criarHttpsAgentEfi() {
  const configuracao = obterConfiguracaoEfi();

  return new https.Agent({
    pfx: configuracao.certificado,
    passphrase: "",
  });
}

function extrairMensagemErroEfi(data: unknown) {
  if (!data || typeof data !== "object") {
    return "Não foi possível comunicar com a Efí Bank.";
  }

  if ("mensagem" in data && typeof data.mensagem === "string") {
    return data.mensagem;
  }

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  if (
    "error_description" in data &&
    typeof data.error_description === "string"
  ) {
    return data.error_description;
  }

  if ("nome" in data && typeof data.nome === "string") {
    return data.nome;
  }

  return "Não foi possível comunicar com a Efí Bank.";
}

async function requestJsonEfi<TResponse>({
  metodo,
  path,
  authorization,
  body,
}: RequestJsonEfiParams): Promise<TResponse> {
  const configuracao = obterConfiguracaoEfi();
  const url = new URL(path, configuracao.baseUrl);
  const payload = body ? JSON.stringify(body) : undefined;

  return new Promise<TResponse>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: metodo,
        agent: criarHttpsAgentEfi(),
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "identity",
          "Content-Type": "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          const rawBody = Buffer.concat(chunks).toString("utf8");
          const data = rawBody ? JSON.parse(rawBody) : null;

          if (!response.statusCode || response.statusCode >= 400) {
            reject(new Error(extrairMensagemErroEfi(data)));
            return;
          }

          resolve(data as TResponse);
        });
      },
    );

    request.on("error", reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

export async function obterTokenEfi() {
  const configuracao = obterConfiguracaoEfi();
  const credenciais = Buffer.from(
    `${configuracao.clientId}:${configuracao.clientSecret}`,
  ).toString("base64");

  return requestJsonEfi<TokenEfiResponse>({
    metodo: "POST",
    path: "/oauth/token",
    body: {
      grant_type: "client_credentials",
    },
    authorization: `Basic ${credenciais}`,
  });
}

export async function chamarApiPixEfi<TResponse>(
  params: Omit<RequestJsonEfiParams, "authorization">,
) {
  const token = await obterTokenEfi();

  return requestJsonEfi<TResponse>({
    ...params,
    authorization: `Bearer ${token.access_token}`,
  });
}
