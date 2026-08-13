# Regularização da baseline Drizzle

Data da validação: 30 de julho de 2026.

> Registro histórico. Desde 12 de agosto de 2026, as branches permanentes descritas abaixo
> não fazem parte do fluxo operacional. Migrations são validadas por uma única branch
> temporária criada automaticamente a partir do desenvolvimento, com um banco clonado e um
> banco vazio, e removida pelo ID ao final.

## Sequência final

A sequência ativa fica isolada em `drizzle/` e contém somente:

- `0000_baseline_consolidada.sql`;
- `meta/0000_snapshot.json`;
- `meta/_journal.json`, com uma única entrada.

O rastreamento novo usa `drizzle_v2.__drizzle_migrations`. A sequência histórica
anterior permanece integralmente em `drizzle-legado/`, acompanhada de manifesto
SHA-256. O ciclo sintético de continuidade foi retirado da sequência ativa e
preservado em `drizzle-testes-baseline/`.

## Reconstrução no banco vazio

Alvo exclusivo: branch `baseline-criacao-vazia`, banco `baseline_vazio`.

- baseline aplicada: uma migration registrada;
- segunda execução: no-op;
- 80 tabelas e 869 colunas;
- 36 enums e 113 valores de enum;
- 150 índices declarados e 239 índices totais, incluindo os implícitos;
- 94 chaves estrangeiras;
- 349 defaults;
- 607 colunas `NOT NULL`;
- 15 sequences;
- nenhuma divergência contra o snapshot gerado de `src/db/schema.ts`;
- tabela `diagnosticos_cotacoes_frete_paralelas` ausente.

Fingerprint final e de no-op:

- estrutura: `2c8fcc5313461b9d894beb52c2268daad639e723c24f2987370035115292824d`;
- dados: `b18c6697bf076cdcb465360f4fb14a9aec82a5e7001d809dceb94caa5cf2fa03`.

## Adoção no clone

Alvo exclusivo: branch `baseline-adocao-clone`, banco `neondb`.

O stamp inseriu somente a baseline no rastreamento
`drizzle_v2.__drizzle_migrations`. O SQL da baseline não foi executado sobre as
estruturas existentes.

Antes e depois do stamp:

- estrutura:
  `4bddc9e950a7f25781c974d03999b8138558b371446a78426a83e8af023c3905`;
- dados:
  `ca0e39eed21b2ff27a36c15dafba6a75fd50b6fe43d54eada813cde1d1168689`.

A execução seguinte do migrator foi no-op. O clone mantém 80 tabelas
administradas e a tabela órfã como sua única tabela pública extra. O fingerprint
de catálogo do clone continuou igual ao da production:
`7efa668e4899a8ce4160336d27d876c26dfc0ea9b0d2b18fc2a2cfb327788c4d`.

## Migration sintética posterior

Foi gerado e aplicado um par reversível:

1. criação da tabela vazia `teste_migration_sintetica`;
2. remoção integral dessa tabela.

O par funcionou nos dois ambientes descartáveis. Após a reversão, os
fingerprints de estrutura e dados retornaram exatamente aos valores anteriores.
Os dois registros sintéticos foram então removidos apenas do rastreamento v2 dos
ambientes descartáveis, sem alterar objetos públicos ou dados. Cada ambiente
terminou novamente com uma única migration registrada.

Os SQLs, snapshots, journal completo e manifesto SHA-256 do teste estão em
`drizzle-testes-baseline/`.

## Proteções

Os scripts de aplicação, stamp e fingerprint:

- carregam apenas variáveis explicitamente nomeadas para os ambientes
  descartáveis;
- recusam a URL principal;
- validam projeto, branch, endpoint e banco antes de qualquer escrita;
- exigem três branches e endpoints distintos;
- não exibem credenciais.

Os arquivos locais de ambiente permanecem ignorados por `.gitignore`. Nenhuma
credencial foi adicionada a arquivos versionados. Durante a validação
descartável, nenhuma migration, stamp ou DDL foi executado na production.

## Adoção na production

Executada em 30 de julho de 2026 após criação externa da branch de recuperação
`backup-production-pre-baseline`.

O procedimento protegido confirmou antes da escrita:

- projeto, branch, endpoint e banco esperados;
- 80 tabelas administradas;
- tabela órfã presente;
- rastreamento `drizzle_v2` inexistente;
- fingerprint estrutural
  `7efa668e4899a8ce4160336d27d876c26dfc0ea9b0d2b18fc2a2cfb327788c4d`;
- fingerprint de dados
  `ca0e39eed21b2ff27a36c15dafba6a75fd50b6fe43d54eada813cde1d1168689`.

O stamp criou somente `drizzle_v2.__drizzle_migrations` e registrou uma única
baseline. O SQL consolidado não foi executado.

As inspeções posteriores e o migrator protegido no-op mantiveram exatamente os
mesmos fingerprints estrutural e de dados. As 80 tabelas administradas e a
tabela órfã foram preservadas. Nenhuma branch de recuperação ou teste foi
acessada ou alterada pelo procedimento.
