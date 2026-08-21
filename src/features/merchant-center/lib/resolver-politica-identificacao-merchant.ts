import type { ItemMerchant } from "../types/item-merchant";

type PoliticaIdentificacaoMerchant = Pick<
  ItemMerchant,
  "condition" | "identifierExists"
>;

/**
 * O catálogo ainda não possui fonte canônica de condição nem comprovação de
 * ausência de identificadores. A política explícita é omitir ambos: `condition`
 * é opcional para novos e `identifier_exists` assume `yes` quando ausente.
 */
export function resolverPoliticaIdentificacaoMerchant(): PoliticaIdentificacaoMerchant {
  return {};
}
