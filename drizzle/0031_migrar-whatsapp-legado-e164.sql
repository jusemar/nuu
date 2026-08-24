-- Esta migration aceita somente o formato legado que foi auditado: 55 + DDD
-- brasileiro válido + celular iniciado por 9. Qualquer valor ambíguo aborta a
-- transação; nenhum telefone de perfil, checkout, endereço ou pedido participa.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "user"
    WHERE "whatsapp" IS NOT NULL
      AND "whatsapp" !~ '^55[1-9][0-9]9[0-9]{8}$'
  ) THEN
    RAISE EXCEPTION 'MIGRACAO_IDENTIDADE_WHATSAPP_INVALIDO';
  END IF;
END
$$;--> statement-breakpoint

-- A comparação usa exatamente o E.164 que será persistido. Se dois legados
-- convergirem para o mesmo valor, a migration falha em vez de escolher um user.
DO $$
BEGIN
  IF EXISTS (
    SELECT '+' || "whatsapp"
    FROM "user"
    WHERE "whatsapp" IS NOT NULL
    GROUP BY '+' || "whatsapp"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'MIGRACAO_IDENTIDADE_WHATSAPP_DUPLICADO';
  END IF;
END
$$;--> statement-breakpoint

-- Também recusamos tanto uma identidade diferente já preenchida no próprio
-- registro quanto uma colisão com o phone_number de qualquer outro user.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "user" candidato
    WHERE candidato."whatsapp" IS NOT NULL
      AND candidato."phone_number" IS NOT NULL
      AND candidato."phone_number" <> '+' || candidato."whatsapp"
  ) OR EXISTS (
    SELECT 1
    FROM "user" candidato
    INNER JOIN "user" existente
      ON existente."phone_number" = '+' || candidato."whatsapp"
     AND existente."id" <> candidato."id"
    WHERE candidato."whatsapp" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'MIGRACAO_IDENTIDADE_PHONE_NUMBER_COLISAO';
  END IF;
END
$$;--> statement-breakpoint

UPDATE "user"
SET
  "phone_number" = '+' || "whatsapp",
  "phone_number_verified" = false
WHERE "whatsapp" IS NOT NULL;
