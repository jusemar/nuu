import "server-only";

// Mantém o contrato atual do checkout usando a configuração global compartilhada.
export {
  obterRemetenteEmailTransacional,
  obterResend,
} from "@/lib/email/cliente-resend";
