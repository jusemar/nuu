export function obterIpRequisicaoOtp(requisicao?: Request) {
  const encaminhado = requisicao?.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return (
    encaminhado ||
    requisicao?.headers.get("x-real-ip")?.trim() ||
    "ip-indisponivel"
  );
}
