import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE_URL_PRODUCAO = "https://pix.api.efipay.com.br";
const BASE_URL_HOMOLOGACAO = "https://pix-h.api.efipay.com.br";
type VariaveisAmbienteEfi = Record<string, string | undefined>;

function lerVariavelObrigatoria(nome: string, variaveis: VariaveisAmbienteEfi) {
  const valor = variaveis[nome]?.trim();

  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não configurada.`);
  }

  return valor;
}

/**
 * Converte o certificado secreto da Vercel sem materializá-lo no filesystem.
 *
 * `Buffer.from(..., "base64")` aceita silenciosamente algumas entradas inválidas.
 * A comparação canônica impede que uma variável truncada ou com caracteres estranhos
 * só falhe mais tarde, durante o handshake mTLS, com uma mensagem pouco útil.
 */
export function decodificarCertificadoEfiBase64(valor: string) {
  const base64 = valor.replace(/\s/g, "");

  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error("EFI_CERTIFICATE_BASE64 não contém um Base64 válido.");
  }

  const certificado = Buffer.from(base64, "base64");
  const entradaCanonica = base64.replace(/=+$/, "");
  const certificadoCanonico = certificado.toString("base64").replace(/=+$/, "");

  if (!certificado.length || entradaCanonica !== certificadoCanonico) {
    throw new Error("EFI_CERTIFICATE_BASE64 não contém um Base64 válido.");
  }

  return certificado;
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

export function obterConfiguracaoEfi(
  variaveis: VariaveisAmbienteEfi = process.env,
) {
  const ambienteAplicacao = variaveis.APP_ENVIRONMENT?.trim();

  if (
    ambienteAplicacao &&
    ambienteAplicacao !== "homologacao" &&
    ambienteAplicacao !== "producao"
  ) {
    throw new Error(
      "APP_ENVIRONMENT deve ser homologacao ou producao para configurar a Efí.",
    );
  }

  if (
    ambienteAplicacao === "producao" &&
    variaveis.EFI_SANDBOX?.trim() === "true"
  ) {
    throw new Error(
      "Configuração Efí incompatível: produção não pode usar sandbox.",
    );
  }

  if (
    ambienteAplicacao === "homologacao" &&
    variaveis.EFI_SANDBOX?.trim() === "false"
  ) {
    throw new Error(
      "Configuração Efí incompatível: homologação não pode usar produção.",
    );
  }

  // APP_ENVIRONMENT é soberano no runtime. EFI_SANDBOX permanece apenas para o
  // desenvolvimento local legado, onde APP_ENVIRONMENT ainda pode estar ausente.
  const sandbox = ambienteAplicacao
    ? ambienteAplicacao === "homologacao"
    : variaveis.EFI_SANDBOX !== "false";

  const certificado = sandbox
    ? readFileSync(
        resolverCaminhoCertificado(
          lerVariavelObrigatoria("EFI_CERTIFICATE_PATH", variaveis),
        ),
      )
    : decodificarCertificadoEfiBase64(
        lerVariavelObrigatoria("EFI_CERTIFICATE_BASE64", variaveis),
      );

  return {
    sandbox,
    baseUrl: sandbox ? BASE_URL_HOMOLOGACAO : BASE_URL_PRODUCAO,
    clientId: lerVariavelObrigatoria("EFI_CLIENT_ID", variaveis),
    clientSecret: lerVariavelObrigatoria("EFI_CLIENT_SECRET", variaveis),
    pixKey: lerVariavelObrigatoria("EFI_PIX_KEY", variaveis),
    certificado,
  };
}
