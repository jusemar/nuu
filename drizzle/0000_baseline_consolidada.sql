CREATE TYPE "public"."banner_home_destaque" AS ENUM('promocao', 'oferta', 'lancamento', 'institucional');--> statement-breakpoint
CREATE TYPE "public"."banner_home_posicao" AS ENUM('principal_esquerdo', 'secundario_direito');--> statement-breakpoint
CREATE TYPE "public"."banner_home_tipo" AS ENUM('svg', 'imagem');--> statement-breakpoint
CREATE TYPE "public"."checkout_pagamento_gateway" AS ENUM('stripe', 'efibank');--> statement-breakpoint
CREATE TYPE "public"."checkout_pagamento_metodo" AS ENUM('cartao', 'pix');--> statement-breakpoint
CREATE TYPE "public"."checkout_pagamento_status" AS ENUM('pending', 'paid', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."checkout_pedido_historico_origem" AS ENUM('system', 'admin');--> statement-breakpoint
CREATE TYPE "public"."checkout_pedido_historico_tipo" AS ENUM('pedido_criado', 'pagamento_aprovado', 'status_alterado_manual', 'pedido_enviado', 'rastreio_atualizado', 'pedido_entregue');--> statement-breakpoint
CREATE TYPE "public"."checkout_pedido_status" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'canceled', 'refunded', 'expired');--> statement-breakpoint
CREATE TYPE "public"."cliente_tipo_pessoa" AS ENUM('fisica', 'juridica');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_integracao_api_ambiente" AS ENUM('homologacao', 'producao');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_integracao_api_provedor" AS ENUM('laquila');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_integracao_api_teste_status" AS ENUM('nao_testado', 'sucesso', 'erro');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_integracao_log_status" AS ENUM('sucesso', 'erro');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_mapeamento_coluna_destino" AS ENUM('codigo_fornecedor', 'nome_produto', 'categoria_fornecedor', 'marca_fornecedor', 'preco_fornecedor', 'estoque_fornecedor');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_preco_origem_ajuste" AS ENUM('global', 'categoria', 'produto', 'nenhum');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_produto_api_staging_status" AS ENUM('novo', 'vinculado', 'atencao', 'ignorado');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_produto_staging_status" AS ENUM('aguardando_analise', 'localizado', 'nao_localizado', 'erro', 'rejeitado', 'aprovado', 'ignorado');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_produto_vinculo_status" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_produto_vinculo_tipo" AS ENUM('manual', 'automatico');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_status" AS ENUM('ativo', 'inativo', 'pendente');--> statement-breakpoint
CREATE TYPE "public"."fornecedor_tipo_integracao" AS ENUM('arquivo_excel', 'api');--> statement-breakpoint
CREATE TYPE "public"."importacao_fornecedor_ajuste_escopo" AS ENUM('global', 'categoria', 'produto');--> statement-breakpoint
CREATE TYPE "public"."importacao_fornecedor_ajuste_status" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "public"."importacao_fornecedor_ajuste_tipo" AS ENUM('percentual', 'valor_fixo');--> statement-breakpoint
CREATE TYPE "public"."importacao_fornecedor_status" AS ENUM('pendente', 'em_staging', 'em_homologacao', 'aprovada', 'rejeitada', 'erro');--> statement-breakpoint
CREATE TYPE "public"."importacao_fornecedor_tipo_arquivo" AS ENUM('arquivo_excel', 'api');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."precificacao_alvo_regra_promocional" AS ENUM('global', 'produto', 'categoria');--> statement-breakpoint
CREATE TYPE "public"."precificacao_tipo_regra_promocional" AS ENUM('percentual_desconto', 'valor_fixo_desconto', 'preco_fixo');--> statement-breakpoint
CREATE TYPE "public"."produto_rascunho_origem_tipo" AS ENUM('manual', 'fornecedor_api', 'fornecedor_excel');--> statement-breakpoint
CREATE TYPE "public"."produto_rascunho_status" AS ENUM('rascunho', 'pendente_conciliacao', 'pronto_para_publicar', 'ignorado');--> statement-breakpoint
CREATE TYPE "public"."promocao_status" AS ENUM('ativa', 'inativa', 'agendada', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."promocao_tipo_beneficio" AS ENUM('desconto', 'frete_gratis');--> statement-breakpoint
CREATE TYPE "public"."promocao_tipo_campanha" AS ENUM('normal', 'relampago');--> statement-breakpoint
CREATE TYPE "public"."promocao_tipo_desconto" AS ENUM('percentual', 'valor_fixo');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bairros_avulsos" (
	"id" serial PRIMARY KEY NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"base_shipping_price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners_home" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posicao" "banner_home_posicao" NOT NULL,
	"tipo_banner" "banner_home_tipo" DEFAULT 'svg' NOT NULL,
	"modelo_svg" text NOT NULL,
	"variacao_visual" text DEFAULT 'azul_ambar' NOT NULL,
	"titulo" text,
	"subtitulo" text,
	"texto_apoio" text,
	"preco_chamada" text,
	"texto_botao" text,
	"link_botao" text,
	"imagem_url" text,
	"imagem_alt" text,
	"imagem_mobile_url" text,
	"foco_imagem" text DEFAULT 'center' NOT NULL,
	"tamanho_imagem" text DEFAULT 'cover' NOT NULL,
	"metadata_imagem" jsonb,
	"tipo_destaque" "banner_home_destaque" DEFAULT 'oferta' NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"shipping_address_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"level" integer DEFAULT 0 NOT NULL,
	"order_index" integer DEFAULT 0,
	"image_url" text,
	"meta_title" text,
	"meta_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ceps_especificos" (
	"id" serial PRIMARY KEY NOT NULL,
	"cep" varchar(8) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"shipping_price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ceps_especificos_cep_unique" UNIQUE("cep")
);
--> statement-breakpoint
CREATE TABLE "checkout_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text NOT NULL,
	"documento" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_efi_webhook_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador_evento" text NOT NULL,
	"end_to_end_id" text,
	"txid" text,
	"pedido_id" uuid,
	"pagamento_id" uuid,
	"status_processamento" text NOT NULL,
	"erro" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_enderecos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"cep" text NOT NULL,
	"rua" text NOT NULL,
	"numero" text NOT NULL,
	"complemento" text,
	"bairro" text NOT NULL,
	"cidade" text NOT NULL,
	"estado" text NOT NULL,
	"observacao" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_pagamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"gateway" "checkout_pagamento_gateway" NOT NULL,
	"metodo" "checkout_pagamento_metodo" NOT NULL,
	"status" "checkout_pagamento_status" DEFAULT 'pending' NOT NULL,
	"valor_em_centavos" integer NOT NULL,
	"transaction_id" text,
	"pix_txid" text,
	"qr_code" text,
	"copia_e_cola" text,
	"provider_response" jsonb,
	"expires_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_pedido_historicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"tipo" "checkout_pedido_historico_tipo" NOT NULL,
	"descricao" text NOT NULL,
	"origem" "checkout_pedido_historico_origem" NOT NULL,
	"status_anterior" "checkout_pedido_status",
	"status_novo" "checkout_pedido_status",
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_pedido_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"variante_id" uuid,
	"nome_produto" text NOT NULL,
	"nome_variante" text,
	"atributos_variante" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sku_produto" text,
	"modalidade" text,
	"prazo_modalidade" text,
	"imagem_url" text,
	"quantidade" integer NOT NULL,
	"preco_unitario_em_centavos" integer NOT NULL,
	"total_em_centavos" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_pedido_logisticas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"transportadora" text,
	"provedor_frete" text,
	"modalidade_frete" text,
	"valor_frete_em_centavos" integer,
	"prazo_frete" text,
	"cep_frete" text,
	"fallback_frete_utilizado" boolean DEFAULT false NOT NULL,
	"snapshot_frete" jsonb,
	"codigo_rastreio" text,
	"data_envio" timestamp,
	"data_entrega" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_pedido" text NOT NULL,
	"cliente_id" uuid NOT NULL,
	"endereco_id" uuid NOT NULL,
	"status" "checkout_pedido_status" DEFAULT 'pending' NOT NULL,
	"subtotal_em_centavos" integer NOT NULL,
	"frete_em_centavos" integer NOT NULL,
	"desconto_em_centavos" integer DEFAULT 0 NOT NULL,
	"desconto_promocional_em_centavos" integer DEFAULT 0 NOT NULL,
	"desconto_cupom_em_centavos" integer DEFAULT 0 NOT NULL,
	"economia_total_em_centavos" integer DEFAULT 0 NOT NULL,
	"total_em_centavos" integer NOT NULL,
	"codigo_cupom_aplicado" text,
	"snapshot_descontos" jsonb,
	"gateway_pagamento" "checkout_pagamento_gateway" NOT NULL,
	"pagamento_status" "checkout_pagamento_status" DEFAULT 'pending' NOT NULL,
	"observacao" text,
	"observacao_cliente" text,
	"autorizar_entrega_vizinho" boolean DEFAULT false NOT NULL,
	"nome_vizinho" text,
	"observacao_vizinho" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_pedidos_numero_pedido_unique" UNIQUE("numero_pedido")
);
--> statement-breakpoint
CREATE TABLE "checkout_stripe_webhook_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" text NOT NULL,
	"tipo_evento" text NOT NULL,
	"pedido_id" uuid,
	"pagamento_id" uuid,
	"status_processamento" text NOT NULL,
	"erro" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"state_uf" varchar(2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"neighborhoods_count" integer DEFAULT 0 NOT NULL,
	"has_slots_configured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config_horario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hora_abertura" time NOT NULL,
	"hora_fechamento" time NOT NULL,
	"usa_intervalo_almoco" boolean DEFAULT false NOT NULL,
	"hora_almoco_inicio" time,
	"hora_almoco_fim" time,
	"dias_funcionamento" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracoes_loja" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"nome_comercial" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracoes_pagamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"pix_ativo" boolean DEFAULT true NOT NULL,
	"cartao_ativo" boolean DEFAULT true NOT NULL,
	"boleto_ativo" boolean DEFAULT false NOT NULL,
	"percentual_acrescimo_cartao_bps" integer DEFAULT 1500 NOT NULL,
	"parcelas_sem_juros" integer DEFAULT 3 NOT NULL,
	"taxa_juros_mensal_bps" integer DEFAULT 199 NOT NULL,
	"maximo_parcelas" integer DEFAULT 10 NOT NULL,
	"valor_minimo_parcela_em_centavos" integer DEFAULT 500 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cupons_promocao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"frete_gratis" boolean DEFAULT false NOT NULL,
	"prioridade" integer DEFAULT 0 NOT NULL,
	"acumulativo" boolean DEFAULT false NOT NULL,
	"subtotal_minimo" integer DEFAULT 0 NOT NULL,
	"limite_uso_total" integer,
	"limite_uso_por_cliente" integer,
	"total_usos" integer DEFAULT 0 NOT NULL,
	"data_inicio" timestamp NOT NULL,
	"data_fim" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"price_config" jsonb NOT NULL,
	"min_days" integer DEFAULT 0 NOT NULL,
	"max_days" integer DEFAULT 0 NOT NULL,
	"cutoff_times" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allows_scheduling" boolean DEFAULT false NOT NULL,
	"operating_days" jsonb DEFAULT '[1,2,3,4,5,6]'::jsonb NOT NULL,
	"max_weight" numeric(8, 2),
	"max_dimensions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enderecos_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"perfil_cliente_id" uuid NOT NULL,
	"cep" text NOT NULL,
	"rua" text NOT NULL,
	"numero" text NOT NULL,
	"complemento" text,
	"bairro" text NOT NULL,
	"cidade" text NOT NULL,
	"estado" text NOT NULL,
	"autorizar_entrega_vizinho" boolean DEFAULT false NOT NULL,
	"nome_vizinho" text,
	"observacao_vizinho" text,
	"principal" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feriados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" date NOT NULL,
	"descricao" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedor_integracao_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integracao_api_id" uuid NOT NULL,
	"metodo" text NOT NULL,
	"operacao" text NOT NULL,
	"status" "fornecedor_integracao_log_status" NOT NULL,
	"codigo_http" integer,
	"mensagem" text,
	"request_resumo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response_resumo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedor_integracoes_api" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fornecedor_id" uuid NOT NULL,
	"provedor" "fornecedor_integracao_api_provedor" NOT NULL,
	"ambiente" "fornecedor_integracao_api_ambiente" DEFAULT 'homologacao' NOT NULL,
	"url_base" text,
	"cnpj_empresa" text NOT NULL,
	"token_cliente_criptografado" text,
	"ativo" boolean DEFAULT false NOT NULL,
	"ultimo_teste_status" "fornecedor_integracao_api_teste_status" DEFAULT 'nao_testado' NOT NULL,
	"ultimo_teste_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedor_mapeamentos_colunas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fornecedor_id" uuid NOT NULL,
	"nome_coluna_origem" text NOT NULL,
	"campo_destino" "fornecedor_mapeamento_coluna_destino" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedor_produto_vinculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fornecedor_id" uuid NOT NULL,
	"codigo_fornecedor" text,
	"produto_id" uuid NOT NULL,
	"tipo_vinculo" "fornecedor_produto_vinculo_tipo" DEFAULT 'manual' NOT NULL,
	"status" "fornecedor_produto_vinculo_status" DEFAULT 'ativo' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedor_produtos_api_staging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integracao_api_id" uuid NOT NULL,
	"codigo_fornecedor" text NOT NULL,
	"nome_produto" text NOT NULL,
	"ean" text,
	"ncm" text,
	"marca_fornecedor" text,
	"grupo_fornecedor" text,
	"subgrupo_fornecedor" text,
	"preco_fornecedor" numeric(12, 2),
	"estoque_fornecedor" integer,
	"imagem_url" text,
	"unidade" text,
	"peso_bruto" numeric(12, 4),
	"peso_liquido" numeric(12, 4),
	"largura" numeric(12, 4),
	"altura" numeric(12, 4),
	"comprimento" numeric(12, 4),
	"dados_brutos_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "fornecedor_produto_api_staging_status" DEFAULT 'novo' NOT NULL,
	"ultima_consulta_em" timestamp NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedor_produtos_staging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"importacao_id" uuid NOT NULL,
	"codigo_fornecedor" text,
	"nome_produto" text NOT NULL,
	"categoria_fornecedor" text,
	"marca_fornecedor" text,
	"preco_fornecedor" numeric(12, 2),
	"preco_original" numeric(12, 2),
	"preco_calculado" numeric(12, 2),
	"origem_ajuste" "fornecedor_preco_origem_ajuste" DEFAULT 'nenhum' NOT NULL,
	"estoque_fornecedor" integer,
	"produto_localizado_id" uuid,
	"criterio_localizacao" text,
	"erros_validacao" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dados_brutos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "fornecedor_produto_staging_status" DEFAULT 'aguardando_analise' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"tipo_integracao" "fornecedor_tipo_integracao" NOT NULL,
	"status" "fornecedor_status" DEFAULT 'pendente' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "importacao_fornecedor_ajustes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"importacao_id" uuid NOT NULL,
	"tipo_ajuste" "importacao_fornecedor_ajuste_tipo" NOT NULL,
	"escopo_ajuste" "importacao_fornecedor_ajuste_escopo" NOT NULL,
	"valor_ajuste" numeric(12, 4) NOT NULL,
	"categoria_fornecedor" text,
	"produto_staging_id" uuid,
	"status" "importacao_fornecedor_ajuste_status" DEFAULT 'ativo' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "importacoes_fornecedor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fornecedor_id" uuid NOT NULL,
	"tipo_arquivo" "importacao_fornecedor_tipo_arquivo" NOT NULL,
	"status" "importacao_fornecedor_status" DEFAULT 'pendente' NOT NULL,
	"nome_arquivo" text,
	"total_linhas" integer DEFAULT 0 NOT NULL,
	"total_processadas" integer DEFAULT 0 NOT NULL,
	"total_erros" integer DEFAULT 0 NOT NULL,
	"colunas_planilha" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mapeamento_colunas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"configuracao_fluxo_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"descricao" text,
	"logo_url" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marca_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "modelos_retirada" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"prazo_texto" text NOT NULL,
	"mensagem" text,
	"ativo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"city_id" integer NOT NULL,
	"city_name" varchar(100) NOT NULL,
	"state_uf" varchar(2) NOT NULL,
	"cep_range" jsonb NOT NULL,
	"delivery_slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"has_active_slots" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price_in_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"shipping_address_id" uuid NOT NULL,
	"recipientName" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"neighborhood" text NOT NULL,
	"zipCode" text NOT NULL,
	"country" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"cpfOrCnpj" text NOT NULL,
	"total_price_in_cents" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfis_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tipo_pessoa" "cliente_tipo_pessoa" NOT NULL,
	"nome_completo" text NOT NULL,
	"documento" text NOT NULL,
	"telefone" text NOT NULL,
	"data_nascimento" date,
	"observacao_cliente" text,
	"perfil_completo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"values" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_delivery_methods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_delivery_methods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" uuid NOT NULL,
	"delivery_method_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"custom_price_in_cents" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text,
	"is_primary" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"image_url" text,
	"external_image_id" text,
	"sort_order" integer NOT NULL,
	"alt_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_own_delivery_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"destination_type" varchar(20) NOT NULL,
	"region_id" integer,
	"bairro_avulso_id" integer,
	"cep_especifico_id" integer,
	"city_id" integer,
	"shipping_price" integer NOT NULL,
	"delivery_deadline" text,
	"scheduled_delivery_active" boolean DEFAULT false NOT NULL,
	"scheduled_delivery_min_days" integer,
	"scheduled_delivery_price" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" text NOT NULL,
	"pricing_modal_description" text,
	"price_in_cents" integer NOT NULL,
	"main_card_price" boolean DEFAULT false,
	"delivery_days" text,
	"has_promo" boolean DEFAULT false,
	"promo_type" text,
	"promo_price_in_cents" integer,
	"promo_end_date" timestamp,
	"legado_promocao_migrado_em" timestamp,
	"legado_promocao_migrado_para_regra_id" uuid,
	"promo_duration" integer,
	"promo_duration_unit" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_suppliers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_suppliers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" uuid NOT NULL,
	"supplier_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"card_short_text" text,
	"description" text NOT NULL,
	"brand" text,
	"marca_id" uuid NOT NULL,
	"store_product_flags" text[] DEFAULT '{}',
	"product_kind" text DEFAULT 'simple' NOT NULL,
	"sku" text DEFAULT gen_random_uuid() NOT NULL,
	"product_type" text,
	"product_code" text,
	"ncm_code" text,
	"status" text DEFAULT 'draft',
	"collection" text,
	"tags" text[],
	"cost_price_in_cents" integer,
	"sale_price_in_cents" integer,
	"promo_price_in_cents" integer,
	"tax_rate" integer,
	"weight_in_grams" integer,
	"length_in_cm" integer,
	"width_in_cm" integer,
	"height_in_cm" integer,
	"has_free_shipping" boolean DEFAULT false,
	"has_local_pickup" boolean DEFAULT false,
	"warranty_period_in_days" integer,
	"warranty_provider" text,
	"seller_code" text,
	"internal_code" text,
	"seller_info" text,
	"meta_title" text,
	"meta_description" text,
	"canonical_url" text,
	"allowed_delivery_types" text[] DEFAULT '{"own"}',
	"allows_own_delivery" boolean DEFAULT true,
	"allows_supplier_delivery" boolean DEFAULT false,
	"allows_pickup" boolean DEFAULT false,
	"modelo_retirada_id" uuid,
	"prazo_retirada_custom" text,
	"requires_carrier_only" boolean DEFAULT false,
	"preferred_supplier_ids" jsonb DEFAULT '[]'::jsonb,
	"allowed_delivery_method_ids" jsonb DEFAULT '[]'::jsonb,
	"additional_delivery_days" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_variant_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"name" text,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_in_cents" integer NOT NULL,
	"compare_price_in_cents" integer,
	"cost_price_in_cents" integer,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"weight_in_grams" integer,
	"length_in_cm" integer,
	"width_in_cm" integer,
	"height_in_cm" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_variant_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "produto_rascunhos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origem_tipo" "produto_rascunho_origem_tipo" NOT NULL,
	"origem_provedor" text,
	"fornecedor_id" uuid,
	"integracao_api_id" uuid,
	"codigo_fornecedor" text,
	"nome" text NOT NULL,
	"descricao" text,
	"categoria_id" uuid,
	"marca_id" uuid,
	"ean" text,
	"ncm" text,
	"preco_fornecedor" numeric(12, 2),
	"preco_loja" numeric(12, 2),
	"estoque_fornecedor" integer,
	"peso" numeric(12, 4),
	"altura" numeric(12, 4),
	"largura" numeric(12, 4),
	"comprimento" numeric(12, 4),
	"imagens" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dados_origem_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "produto_rascunho_status" DEFAULT 'rascunho' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos_tipos_logisticos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"tipo_logistico_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provedores_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regiao_bairros" (
	"id" serial PRIMARY KEY NOT NULL,
	"regiao_id" integer NOT NULL,
	"neighborhood" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_categorias_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria_id" uuid NOT NULL,
	"efeito" text NOT NULL,
	"provedor_frete_id" uuid,
	"transportadora_frete_id" uuid,
	"servico_frete_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_produtos_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"efeito" text NOT NULL,
	"provedor_frete_id" uuid,
	"transportadora_frete_id" uuid,
	"servico_frete_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_promocao_categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_promocao_fretes_gratis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"subtotal_minimo" integer NOT NULL,
	"modalidade" text,
	"forma_entrega" text,
	"mensagem_progressiva" text,
	"regiao_codigo" text,
	"transportadora_codigo" text,
	"servico_codigo" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_promocao_marcas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"marca_id" uuid NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_promocao_produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"modalidade" text,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_promocao_subtotais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"subtotal_minimo" integer NOT NULL,
	"subtotal_maximo" integer,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_promocao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"status" "promocao_status" DEFAULT 'inativa' NOT NULL,
	"tipo_beneficio" "promocao_tipo_beneficio" DEFAULT 'desconto' NOT NULL,
	"tipo_campanha" "promocao_tipo_campanha" DEFAULT 'normal' NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"prioridade" integer DEFAULT 0 NOT NULL,
	"acumulativa" boolean DEFAULT false NOT NULL,
	"data_inicio" timestamp NOT NULL,
	"data_fim" timestamp,
	"badge_promocional" text,
	"countdown_promocional_data_fim" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_promocionais_precificacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"prioridade" integer DEFAULT 0 NOT NULL,
	"tipo" "precificacao_tipo_regra_promocional" NOT NULL,
	"alvo" "precificacao_alvo_regra_promocional" DEFAULT 'global' NOT NULL,
	"valor_bps" integer,
	"valor_em_centavos" integer,
	"produto_id" uuid,
	"categoria_id" uuid,
	"inicio_em" timestamp,
	"fim_em" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_tipos_logisticos_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_logistico_id" uuid NOT NULL,
	"efeito" text NOT NULL,
	"provedor_frete_id" uuid,
	"transportadora_frete_id" uuid,
	"servico_frete_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicos_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provedor_frete_id" uuid NOT NULL,
	"transportadora_frete_id" uuid,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"peso_maximo_em_gramas" integer,
	"altura_maxima_em_cm" integer,
	"largura_maxima_em_cm" integer,
	"comprimento_maximo_em_cm" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shipping_address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"recipientName" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"neighborhood" text NOT NULL,
	"zipCode" text NOT NULL,
	"country" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"cpfOrCnpj" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_bairro_avulso_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"bairro_avulso_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_pending_neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"last_cep" varchar(8) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"consultation_count" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_consulted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_region_cep_ranges" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"cep_start" varchar(8) NOT NULL,
	"cep_end" varchar(8) NOT NULL,
	"source" varchar(40) DEFAULT 'auto' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_region_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"base_shipping_price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"agenda_ativa" boolean DEFAULT false NOT NULL,
	"horario_corte" varchar(5),
	"periodo_entrega_inicio" varchar(5),
	"periodo_entrega_fim" varchar(5),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_zip_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"cep" varchar(8) NOT NULL,
	"street" text DEFAULT '' NOT NULL,
	"complement" text,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"ibge_code" varchar(20),
	"source" varchar(40) DEFAULT 'external' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"uf" varchar(2) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "states_uf_unique" UNIQUE("uf")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"delivery_config" jsonb NOT NULL,
	"served_regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_products_count" integer DEFAULT 0 NOT NULL,
	"contact_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipos_logisticos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transportadoras_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provedor_frete_id" uuid NOT NULL,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"peso_maximo_em_gramas" integer,
	"altura_maxima_em_cm" integer,
	"largura_maxima_em_cm" integer,
	"comprimento_maximo_em_cm" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"whatsapp" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usos_cupons_promocao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cupom_promocao_id" uuid NOT NULL,
	"cliente_id" uuid,
	"pedido_id" uuid,
	"codigo_cupom" text NOT NULL,
	"valor_desconto_em_centavos" integer DEFAULT 0 NOT NULL,
	"usado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variantes_tipos_logisticos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variante_id" uuid NOT NULL,
	"tipo_logistico_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_variant_id_product_variant_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_shipping_address_id_shipping_address_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."shipping_address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_efi_webhook_eventos" ADD CONSTRAINT "checkout_efi_webhook_eventos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_efi_webhook_eventos" ADD CONSTRAINT "checkout_efi_webhook_eventos_pagamento_id_checkout_pagamentos_id_fk" FOREIGN KEY ("pagamento_id") REFERENCES "public"."checkout_pagamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_enderecos" ADD CONSTRAINT "checkout_enderecos_cliente_id_checkout_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pagamentos" ADD CONSTRAINT "checkout_pagamentos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pedido_historicos" ADD CONSTRAINT "checkout_pedido_historicos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pedido_itens" ADD CONSTRAINT "checkout_pedido_itens_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pedido_logisticas" ADD CONSTRAINT "checkout_pedido_logisticas_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD CONSTRAINT "checkout_pedidos_cliente_id_checkout_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD CONSTRAINT "checkout_pedidos_endereco_id_checkout_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."checkout_enderecos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_stripe_webhook_eventos" ADD CONSTRAINT "checkout_stripe_webhook_eventos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_stripe_webhook_eventos" ADD CONSTRAINT "checkout_stripe_webhook_eventos_pagamento_id_checkout_pagamentos_id_fk" FOREIGN KEY ("pagamento_id") REFERENCES "public"."checkout_pagamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_uf_states_uf_fk" FOREIGN KEY ("state_uf") REFERENCES "public"."states"("uf") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enderecos_clientes" ADD CONSTRAINT "enderecos_clientes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enderecos_clientes" ADD CONSTRAINT "enderecos_clientes_perfil_cliente_id_perfis_clientes_id_fk" FOREIGN KEY ("perfil_cliente_id") REFERENCES "public"."perfis_clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_integracao_logs" ADD CONSTRAINT "fornecedor_integracao_logs_integracao_api_id_fornecedor_integracoes_api_id_fk" FOREIGN KEY ("integracao_api_id") REFERENCES "public"."fornecedor_integracoes_api"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_integracoes_api" ADD CONSTRAINT "fornecedor_integracoes_api_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_mapeamentos_colunas" ADD CONSTRAINT "fornecedor_mapeamentos_colunas_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_produto_vinculos" ADD CONSTRAINT "fornecedor_produto_vinculos_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_produto_vinculos" ADD CONSTRAINT "fornecedor_produto_vinculos_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_produtos_api_staging" ADD CONSTRAINT "fornecedor_produtos_api_staging_integracao_api_id_fornecedor_integracoes_api_id_fk" FOREIGN KEY ("integracao_api_id") REFERENCES "public"."fornecedor_integracoes_api"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_produtos_staging" ADD CONSTRAINT "fornecedor_produtos_staging_importacao_id_importacoes_fornecedor_id_fk" FOREIGN KEY ("importacao_id") REFERENCES "public"."importacoes_fornecedor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_produtos_staging" ADD CONSTRAINT "fornecedor_produtos_staging_produto_localizado_id_product_id_fk" FOREIGN KEY ("produto_localizado_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacao_fornecedor_ajustes" ADD CONSTRAINT "importacao_fornecedor_ajustes_importacao_id_importacoes_fornecedor_id_fk" FOREIGN KEY ("importacao_id") REFERENCES "public"."importacoes_fornecedor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacao_fornecedor_ajustes" ADD CONSTRAINT "importacao_fornecedor_ajustes_produto_staging_id_fornecedor_produtos_staging_id_fk" FOREIGN KEY ("produto_staging_id") REFERENCES "public"."fornecedor_produtos_staging"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacoes_fornecedor" ADD CONSTRAINT "importacoes_fornecedor_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_variant_id_product_variant_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_shipping_address_id_shipping_address_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."shipping_address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfis_clientes" ADD CONSTRAINT "perfis_clientes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute" ADD CONSTRAINT "product_attribute_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_delivery_methods" ADD CONSTRAINT "product_delivery_methods_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_delivery_methods" ADD CONSTRAINT "product_delivery_methods_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_gallery_images" ADD CONSTRAINT "product_gallery_images_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_variant_id_product_variant_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_region_id_shipping_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_bairro_avulso_id_bairros_avulsos_id_fk" FOREIGN KEY ("bairro_avulso_id") REFERENCES "public"."bairros_avulsos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_cep_especifico_id_ceps_especificos_id_fk" FOREIGN KEY ("cep_especifico_id") REFERENCES "public"."ceps_especificos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_pricing" ADD CONSTRAINT "product_pricing_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_marca_id_marca_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_modelo_retirada_id_modelos_retirada_id_fk" FOREIGN KEY ("modelo_retirada_id") REFERENCES "public"."modelos_retirada"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_image" ADD CONSTRAINT "product_variant_image_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_rascunhos" ADD CONSTRAINT "produto_rascunhos_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_rascunhos" ADD CONSTRAINT "produto_rascunhos_integracao_api_id_fornecedor_integracoes_api_id_fk" FOREIGN KEY ("integracao_api_id") REFERENCES "public"."fornecedor_integracoes_api"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_rascunhos" ADD CONSTRAINT "produto_rascunhos_categoria_id_category_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_rascunhos" ADD CONSTRAINT "produto_rascunhos_marca_id_marca_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_tipos_logisticos" ADD CONSTRAINT "produtos_tipos_logisticos_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_tipos_logisticos" ADD CONSTRAINT "produtos_tipos_logisticos_tipo_logistico_id_tipos_logisticos_id_fk" FOREIGN KEY ("tipo_logistico_id") REFERENCES "public"."tipos_logisticos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regiao_bairros" ADD CONSTRAINT "regiao_bairros_regiao_id_shipping_regions_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_categoria_id_category_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_categorias" ADD CONSTRAINT "regras_promocao_categorias_regra_promocao_id_regras_promocao_id_fk" FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_categorias" ADD CONSTRAINT "regras_promocao_categorias_categoria_id_category_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_fretes_gratis" ADD CONSTRAINT "regras_promocao_fretes_gratis_regra_promocao_id_regras_promocao_id_fk" FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_marcas" ADD CONSTRAINT "regras_promocao_marcas_regra_promocao_id_regras_promocao_id_fk" FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_marcas" ADD CONSTRAINT "regras_promocao_marcas_marca_id_marca_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_produtos" ADD CONSTRAINT "regras_promocao_produtos_regra_promocao_id_regras_promocao_id_fk" FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_produtos" ADD CONSTRAINT "regras_promocao_produtos_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocao_subtotais" ADD CONSTRAINT "regras_promocao_subtotais_regra_promocao_id_regras_promocao_id_fk" FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocionais_precificacao" ADD CONSTRAINT "regras_promocionais_precificacao_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_promocionais_precificacao" ADD CONSTRAINT "regras_promocionais_precificacao_categoria_id_category_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_tipo_logistico_id_tipos_logisticos_id_fk" FOREIGN KEY ("tipo_logistico_id") REFERENCES "public"."tipos_logisticos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_frete" ADD CONSTRAINT "servicos_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_frete" ADD CONSTRAINT "servicos_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_address" ADD CONSTRAINT "shipping_address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_bairro_avulso_slots" ADD CONSTRAINT "shipping_bairro_avulso_slots_bairro_avulso_id_bairros_avulsos_id_fk" FOREIGN KEY ("bairro_avulso_id") REFERENCES "public"."bairros_avulsos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_region_cep_ranges" ADD CONSTRAINT "shipping_region_cep_ranges_region_id_shipping_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_region_slots" ADD CONSTRAINT "shipping_region_slots_region_id_shipping_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transportadoras_frete" ADD CONSTRAINT "transportadoras_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usos_cupons_promocao" ADD CONSTRAINT "usos_cupons_promocao_cupom_promocao_id_cupons_promocao_id_fk" FOREIGN KEY ("cupom_promocao_id") REFERENCES "public"."cupons_promocao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variantes_tipos_logisticos" ADD CONSTRAINT "variantes_tipos_logisticos_variante_id_product_variant_id_fk" FOREIGN KEY ("variante_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variantes_tipos_logisticos" ADD CONSTRAINT "variantes_tipos_logisticos_tipo_logistico_id_tipos_logisticos_id_fk" FOREIGN KEY ("tipo_logistico_id") REFERENCES "public"."tipos_logisticos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "banners_home_posicao_idx" ON "banners_home" USING btree ("posicao");--> statement-breakpoint
CREATE INDEX "banners_home_ativo_idx" ON "banners_home" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "banners_home_ordem_idx" ON "banners_home" USING btree ("ordem");--> statement-breakpoint
CREATE UNIQUE INDEX "banners_home_um_secundario_ativo_idx" ON "banners_home" USING btree ("posicao") WHERE "banners_home"."ativo" = true and "banners_home"."posicao" = 'secundario_direito';--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_slug_idx" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "checkout_clientes_email_idx" ON "checkout_clientes" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_clientes_documento_unique" ON "checkout_clientes" USING btree ("documento");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_efi_webhook_eventos_identificador_unique" ON "checkout_efi_webhook_eventos" USING btree ("identificador_evento");--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_txid_idx" ON "checkout_efi_webhook_eventos" USING btree ("txid");--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_end_to_end_id_idx" ON "checkout_efi_webhook_eventos" USING btree ("end_to_end_id");--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_pedido_id_idx" ON "checkout_efi_webhook_eventos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_pagamento_id_idx" ON "checkout_efi_webhook_eventos" USING btree ("pagamento_id");--> statement-breakpoint
CREATE INDEX "checkout_enderecos_cliente_id_idx" ON "checkout_enderecos" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "checkout_pagamentos_pedido_id_idx" ON "checkout_pagamentos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_pagamentos_transaction_id_idx" ON "checkout_pagamentos" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "checkout_pagamentos_pix_txid_idx" ON "checkout_pagamentos" USING btree ("pix_txid");--> statement-breakpoint
CREATE INDEX "checkout_pedido_historicos_pedido_id_idx" ON "checkout_pedido_historicos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_pedido_historicos_tipo_idx" ON "checkout_pedido_historicos" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "checkout_pedido_historicos_created_at_idx" ON "checkout_pedido_historicos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "checkout_pedido_itens_pedido_id_idx" ON "checkout_pedido_itens" USING btree ("pedido_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_pedido_logisticas_pedido_id_unique" ON "checkout_pedido_logisticas" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_pedido_logisticas_codigo_rastreio_idx" ON "checkout_pedido_logisticas" USING btree ("codigo_rastreio");--> statement-breakpoint
CREATE INDEX "checkout_pedidos_cliente_id_idx" ON "checkout_pedidos" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "checkout_pedidos_status_idx" ON "checkout_pedidos" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_stripe_webhook_eventos_event_id_unique" ON "checkout_stripe_webhook_eventos" USING btree ("stripe_event_id");--> statement-breakpoint
CREATE INDEX "checkout_stripe_webhook_eventos_pedido_id_idx" ON "checkout_stripe_webhook_eventos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_stripe_webhook_eventos_pagamento_id_idx" ON "checkout_stripe_webhook_eventos" USING btree ("pagamento_id");--> statement-breakpoint
CREATE INDEX "checkout_stripe_webhook_eventos_tipo_idx" ON "checkout_stripe_webhook_eventos" USING btree ("tipo_evento");--> statement-breakpoint
CREATE INDEX "config_horario_dias_idx" ON "config_horario" USING btree ("dias_funcionamento");--> statement-breakpoint
CREATE INDEX "configuracoes_pagamento_ativo_idx" ON "configuracoes_pagamento" USING btree ("ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "cupons_promocao_codigo_unique" ON "cupons_promocao" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "cupons_promocao_ativo_idx" ON "cupons_promocao" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "cupons_promocao_periodo_idx" ON "cupons_promocao" USING btree ("data_inicio","data_fim");--> statement-breakpoint
CREATE INDEX "cupons_promocao_prioridade_idx" ON "cupons_promocao" USING btree ("prioridade");--> statement-breakpoint
CREATE UNIQUE INDEX "enderecos_clientes_user_id_principal_unique" ON "enderecos_clientes" USING btree ("user_id","principal");--> statement-breakpoint
CREATE INDEX "enderecos_clientes_perfil_cliente_id_idx" ON "enderecos_clientes" USING btree ("perfil_cliente_id");--> statement-breakpoint
CREATE INDEX "feriados_data_idx" ON "feriados" USING btree ("data");--> statement-breakpoint
CREATE INDEX "fornecedor_integracao_logs_integracao_api_id_idx" ON "fornecedor_integracao_logs" USING btree ("integracao_api_id");--> statement-breakpoint
CREATE INDEX "fornecedor_integracao_logs_metodo_idx" ON "fornecedor_integracao_logs" USING btree ("metodo");--> statement-breakpoint
CREATE INDEX "fornecedor_integracao_logs_status_idx" ON "fornecedor_integracao_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fornecedor_integracao_logs_criado_em_idx" ON "fornecedor_integracao_logs" USING btree ("criado_em");--> statement-breakpoint
CREATE INDEX "fornecedor_integracoes_api_fornecedor_id_idx" ON "fornecedor_integracoes_api" USING btree ("fornecedor_id");--> statement-breakpoint
CREATE INDEX "fornecedor_integracoes_api_provedor_idx" ON "fornecedor_integracoes_api" USING btree ("provedor");--> statement-breakpoint
CREATE INDEX "fornecedor_integracoes_api_ambiente_idx" ON "fornecedor_integracoes_api" USING btree ("ambiente");--> statement-breakpoint
CREATE INDEX "fornecedor_integracoes_api_ativo_idx" ON "fornecedor_integracoes_api" USING btree ("ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_integracoes_api_fornecedor_provedor_unique" ON "fornecedor_integracoes_api" USING btree ("fornecedor_id","provedor");--> statement-breakpoint
CREATE INDEX "fornecedor_mapeamentos_colunas_fornecedor_id_idx" ON "fornecedor_mapeamentos_colunas" USING btree ("fornecedor_id");--> statement-breakpoint
CREATE INDEX "fornecedor_mapeamentos_colunas_campo_destino_idx" ON "fornecedor_mapeamentos_colunas" USING btree ("campo_destino");--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_mapeamentos_colunas_destino_ativo_unique" ON "fornecedor_mapeamentos_colunas" USING btree ("fornecedor_id","campo_destino") WHERE "fornecedor_mapeamentos_colunas"."ativo" = true;--> statement-breakpoint
CREATE INDEX "fornecedor_produto_vinculos_fornecedor_id_idx" ON "fornecedor_produto_vinculos" USING btree ("fornecedor_id");--> statement-breakpoint
CREATE INDEX "fornecedor_produto_vinculos_produto_id_idx" ON "fornecedor_produto_vinculos" USING btree ("produto_id");--> statement-breakpoint
CREATE INDEX "fornecedor_produto_vinculos_codigo_fornecedor_idx" ON "fornecedor_produto_vinculos" USING btree ("codigo_fornecedor");--> statement-breakpoint
CREATE INDEX "fornecedor_produto_vinculos_status_idx" ON "fornecedor_produto_vinculos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_api_staging_integracao_api_id_idx" ON "fornecedor_produtos_api_staging" USING btree ("integracao_api_id");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_api_staging_status_idx" ON "fornecedor_produtos_api_staging" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_api_staging_codigo_fornecedor_idx" ON "fornecedor_produtos_api_staging" USING btree ("codigo_fornecedor");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_api_staging_ean_idx" ON "fornecedor_produtos_api_staging" USING btree ("ean");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_api_staging_marca_fornecedor_idx" ON "fornecedor_produtos_api_staging" USING btree ("marca_fornecedor");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_api_staging_grupo_fornecedor_idx" ON "fornecedor_produtos_api_staging" USING btree ("grupo_fornecedor");--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_produtos_api_staging_integracao_codigo_unique" ON "fornecedor_produtos_api_staging" USING btree ("integracao_api_id","codigo_fornecedor");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_staging_importacao_id_idx" ON "fornecedor_produtos_staging" USING btree ("importacao_id");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_staging_status_idx" ON "fornecedor_produtos_staging" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_staging_codigo_fornecedor_idx" ON "fornecedor_produtos_staging" USING btree ("codigo_fornecedor");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_staging_produto_localizado_id_idx" ON "fornecedor_produtos_staging" USING btree ("produto_localizado_id");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_staging_criterio_localizacao_idx" ON "fornecedor_produtos_staging" USING btree ("criterio_localizacao");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_staging_origem_ajuste_idx" ON "fornecedor_produtos_staging" USING btree ("origem_ajuste");--> statement-breakpoint
CREATE INDEX "fornecedor_produtos_staging_marca_fornecedor_idx" ON "fornecedor_produtos_staging" USING btree ("marca_fornecedor");--> statement-breakpoint
CREATE INDEX "fornecedores_tipo_integracao_idx" ON "fornecedores" USING btree ("tipo_integracao");--> statement-breakpoint
CREATE INDEX "fornecedores_status_idx" ON "fornecedores" USING btree ("status");--> statement-breakpoint
CREATE INDEX "importacao_fornecedor_ajustes_importacao_id_idx" ON "importacao_fornecedor_ajustes" USING btree ("importacao_id");--> statement-breakpoint
CREATE INDEX "importacao_fornecedor_ajustes_escopo_idx" ON "importacao_fornecedor_ajustes" USING btree ("escopo_ajuste");--> statement-breakpoint
CREATE INDEX "importacao_fornecedor_ajustes_status_idx" ON "importacao_fornecedor_ajustes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "importacao_fornecedor_ajustes_categoria_idx" ON "importacao_fornecedor_ajustes" USING btree ("categoria_fornecedor");--> statement-breakpoint
CREATE INDEX "importacao_fornecedor_ajustes_produto_staging_id_idx" ON "importacao_fornecedor_ajustes" USING btree ("produto_staging_id");--> statement-breakpoint
CREATE INDEX "importacoes_fornecedor_fornecedor_id_idx" ON "importacoes_fornecedor" USING btree ("fornecedor_id");--> statement-breakpoint
CREATE INDEX "importacoes_fornecedor_status_idx" ON "importacoes_fornecedor" USING btree ("status");--> statement-breakpoint
CREATE INDEX "importacoes_fornecedor_criado_em_idx" ON "importacoes_fornecedor" USING btree ("criado_em");--> statement-breakpoint
CREATE INDEX "marca_nome_idx" ON "marca" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "marca_slug_idx" ON "marca" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "perfis_clientes_user_id_unique" ON "perfis_clientes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "perfis_clientes_documento_unique" ON "perfis_clientes" USING btree ("documento");--> statement-breakpoint
CREATE INDEX "perfis_clientes_tipo_pessoa_idx" ON "perfis_clientes" USING btree ("tipo_pessoa");--> statement-breakpoint
CREATE INDEX "produto_rascunhos_origem_tipo_idx" ON "produto_rascunhos" USING btree ("origem_tipo");--> statement-breakpoint
CREATE INDEX "produto_rascunhos_origem_provedor_idx" ON "produto_rascunhos" USING btree ("origem_provedor");--> statement-breakpoint
CREATE INDEX "produto_rascunhos_fornecedor_id_idx" ON "produto_rascunhos" USING btree ("fornecedor_id");--> statement-breakpoint
CREATE INDEX "produto_rascunhos_integracao_api_id_idx" ON "produto_rascunhos" USING btree ("integracao_api_id");--> statement-breakpoint
CREATE INDEX "produto_rascunhos_codigo_fornecedor_idx" ON "produto_rascunhos" USING btree ("codigo_fornecedor");--> statement-breakpoint
CREATE INDEX "produto_rascunhos_status_idx" ON "produto_rascunhos" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "produtos_tipos_logisticos_produto_tipo_unique" ON "produtos_tipos_logisticos" USING btree ("produto_id","tipo_logistico_id");--> statement-breakpoint
CREATE INDEX "produtos_tipos_logisticos_produto_id_idx" ON "produtos_tipos_logisticos" USING btree ("produto_id");--> statement-breakpoint
CREATE INDEX "produtos_tipos_logisticos_tipo_logistico_id_idx" ON "produtos_tipos_logisticos" USING btree ("tipo_logistico_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provedores_frete_identificador_unique" ON "provedores_frete" USING btree ("identificador");--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_categoria_id_idx" ON "regras_categorias_frete" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_provedor_frete_id_idx" ON "regras_categorias_frete" USING btree ("provedor_frete_id");--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_transportadora_frete_id_idx" ON "regras_categorias_frete" USING btree ("transportadora_frete_id");--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_servico_frete_id_idx" ON "regras_categorias_frete" USING btree ("servico_frete_id");--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_produto_id_idx" ON "regras_produtos_frete" USING btree ("produto_id");--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_provedor_frete_id_idx" ON "regras_produtos_frete" USING btree ("provedor_frete_id");--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_transportadora_frete_id_idx" ON "regras_produtos_frete" USING btree ("transportadora_frete_id");--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_servico_frete_id_idx" ON "regras_produtos_frete" USING btree ("servico_frete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "regras_promocao_categorias_regra_categoria_unique" ON "regras_promocao_categorias" USING btree ("regra_promocao_id","categoria_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_categorias_regra_promocao_id_idx" ON "regras_promocao_categorias" USING btree ("regra_promocao_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_categorias_categoria_id_idx" ON "regras_promocao_categorias" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_fretes_gratis_regra_promocao_id_idx" ON "regras_promocao_fretes_gratis" USING btree ("regra_promocao_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_fretes_gratis_subtotal_idx" ON "regras_promocao_fretes_gratis" USING btree ("subtotal_minimo");--> statement-breakpoint
CREATE INDEX "regras_promocao_fretes_gratis_modalidade_idx" ON "regras_promocao_fretes_gratis" USING btree ("modalidade");--> statement-breakpoint
CREATE INDEX "regras_promocao_fretes_gratis_forma_entrega_idx" ON "regras_promocao_fretes_gratis" USING btree ("forma_entrega");--> statement-breakpoint
CREATE INDEX "regras_promocao_fretes_gratis_transportadora_codigo_idx" ON "regras_promocao_fretes_gratis" USING btree ("transportadora_codigo");--> statement-breakpoint
CREATE INDEX "regras_promocao_fretes_gratis_servico_codigo_idx" ON "regras_promocao_fretes_gratis" USING btree ("servico_codigo");--> statement-breakpoint
CREATE UNIQUE INDEX "regras_promocao_marcas_regra_marca_unique" ON "regras_promocao_marcas" USING btree ("regra_promocao_id","marca_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_marcas_regra_promocao_id_idx" ON "regras_promocao_marcas" USING btree ("regra_promocao_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_marcas_marca_id_idx" ON "regras_promocao_marcas" USING btree ("marca_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_produtos_regra_promocao_id_idx" ON "regras_promocao_produtos" USING btree ("regra_promocao_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_produtos_produto_id_idx" ON "regras_promocao_produtos" USING btree ("produto_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_produtos_modalidade_idx" ON "regras_promocao_produtos" USING btree ("modalidade");--> statement-breakpoint
CREATE INDEX "regras_promocao_subtotais_regra_promocao_id_idx" ON "regras_promocao_subtotais" USING btree ("regra_promocao_id");--> statement-breakpoint
CREATE INDEX "regras_promocao_subtotais_faixa_idx" ON "regras_promocao_subtotais" USING btree ("subtotal_minimo","subtotal_maximo");--> statement-breakpoint
CREATE UNIQUE INDEX "regras_promocao_slug_unique" ON "regras_promocao" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "regras_promocao_status_idx" ON "regras_promocao" USING btree ("status");--> statement-breakpoint
CREATE INDEX "regras_promocao_tipo_beneficio_idx" ON "regras_promocao" USING btree ("tipo_beneficio");--> statement-breakpoint
CREATE INDEX "regras_promocao_tipo_campanha_idx" ON "regras_promocao" USING btree ("tipo_campanha");--> statement-breakpoint
CREATE INDEX "regras_promocao_periodo_idx" ON "regras_promocao" USING btree ("data_inicio","data_fim");--> statement-breakpoint
CREATE INDEX "regras_promocao_prioridade_idx" ON "regras_promocao" USING btree ("prioridade");--> statement-breakpoint
CREATE INDEX "regras_promocionais_precificacao_ativo_idx" ON "regras_promocionais_precificacao" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "regras_promocionais_precificacao_produto_id_idx" ON "regras_promocionais_precificacao" USING btree ("produto_id");--> statement-breakpoint
CREATE INDEX "regras_promocionais_precificacao_categoria_id_idx" ON "regras_promocionais_precificacao" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_tipo_id_idx" ON "regras_tipos_logisticos_frete" USING btree ("tipo_logistico_id");--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_provedor_id_idx" ON "regras_tipos_logisticos_frete" USING btree ("provedor_frete_id");--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_transportadora_id_idx" ON "regras_tipos_logisticos_frete" USING btree ("transportadora_frete_id");--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_servico_id_idx" ON "regras_tipos_logisticos_frete" USING btree ("servico_frete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "servicos_frete_provedor_identificador_unique" ON "servicos_frete" USING btree ("provedor_frete_id","identificador");--> statement-breakpoint
CREATE INDEX "servicos_frete_provedor_frete_id_idx" ON "servicos_frete" USING btree ("provedor_frete_id");--> statement-breakpoint
CREATE INDEX "servicos_frete_transportadora_frete_id_idx" ON "servicos_frete" USING btree ("transportadora_frete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_pending_neighborhoods_neighborhood_city_state_idx" ON "shipping_pending_neighborhoods" USING btree ("neighborhood","city","state");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_region_cep_ranges_region_start_end_idx" ON "shipping_region_cep_ranges" USING btree ("region_id","cep_start","cep_end");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_zip_addresses_cep_idx" ON "shipping_zip_addresses" USING btree ("cep");--> statement-breakpoint
CREATE INDEX "shipping_zip_addresses_city_state_idx" ON "shipping_zip_addresses" USING btree ("state","city");--> statement-breakpoint
CREATE INDEX "shipping_zip_addresses_neighborhood_idx" ON "shipping_zip_addresses" USING btree ("neighborhood");--> statement-breakpoint
CREATE UNIQUE INDEX "tipos_logisticos_identificador_unique" ON "tipos_logisticos" USING btree ("identificador");--> statement-breakpoint
CREATE UNIQUE INDEX "transportadoras_frete_provedor_identificador_unique" ON "transportadoras_frete" USING btree ("provedor_frete_id","identificador");--> statement-breakpoint
CREATE INDEX "transportadoras_frete_provedor_frete_id_idx" ON "transportadoras_frete" USING btree ("provedor_frete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_whatsapp_unique" ON "user" USING btree ("whatsapp");--> statement-breakpoint
CREATE INDEX "usos_cupons_promocao_cupom_id_idx" ON "usos_cupons_promocao" USING btree ("cupom_promocao_id");--> statement-breakpoint
CREATE INDEX "usos_cupons_promocao_cliente_id_idx" ON "usos_cupons_promocao" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "usos_cupons_promocao_codigo_idx" ON "usos_cupons_promocao" USING btree ("codigo_cupom");--> statement-breakpoint
CREATE UNIQUE INDEX "usos_cupons_promocao_pedido_cupom_unique" ON "usos_cupons_promocao" USING btree ("pedido_id","cupom_promocao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variantes_tipos_logisticos_variante_tipo_unique" ON "variantes_tipos_logisticos" USING btree ("variante_id","tipo_logistico_id");--> statement-breakpoint
CREATE INDEX "variantes_tipos_logisticos_variante_id_idx" ON "variantes_tipos_logisticos" USING btree ("variante_id");--> statement-breakpoint
CREATE INDEX "variantes_tipos_logisticos_tipo_logistico_id_idx" ON "variantes_tipos_logisticos" USING btree ("tipo_logistico_id");