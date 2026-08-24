const SEPARADOR_EMAILS_ADMIN = /[,;\n]/;

function listarEmailsAdministradores() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(SEPARADOR_EMAILS_ADMIN)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Uso restrito ao bootstrap explícito; nunca autoriza login ou requests. */
export function emailPossuiPermissaoAdmin(email: string | null | undefined) {
  if (!email) return false;
  return listarEmailsAdministradores().has(email.trim().toLowerCase());
}
