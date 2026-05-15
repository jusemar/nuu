import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE_URL_PRODUCAO = "https://pix.api.efipay.com.br";
const BASE_URL_HOMOLOGACAO = "https://pix-h.api.efipay.com.br";

function lerVariavelObrigatoria(nome: string) {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não configurada.`);
  }

  return valor;
}

function resolverCaminhoCertificado(caminhoRelativo: string) {
  const caminhoNormalizado = path.normalize(caminhoRelativo);
  const caminhoAbsoluto = path.resolve(process.cwd(), caminhoNormalizado);
  const raizProjeto = path.resolve(process.cwd());

  if (!caminhoAbsoluto.startsWith(raizProjeto)) {
    throw new Error("Caminho do certificado Efí fora do projeto.");
  }

  if (!existsSync(caminhoAbsoluto)) {
    throw new Error("Certificado Efí não encontrado no caminho configurado.");
  }

  return caminhoAbsoluto;
}

export function obterConfiguracaoEfi() {
  const sandbox = process.env.EFI_SANDBOX !== "false";
  const caminhoCertificado = resolverCaminhoCertificado(
    lerVariavelObrigatoria("EFI_CERTIFICATE_PATH"),
  );

  return {
    sandbox,
    baseUrl: sandbox ? BASE_URL_HOMOLOGACAO : BASE_URL_PRODUCAO,
    clientId: lerVariavelObrigatoria("EFI_CLIENT_ID"),
    clientSecret: lerVariavelObrigatoria("EFI_CLIENT_SECRET"),
    pixKey: lerVariavelObrigatoria("EFI_PIX_KEY"),
    certificado: readFileSync(caminhoCertificado),
  };
}
