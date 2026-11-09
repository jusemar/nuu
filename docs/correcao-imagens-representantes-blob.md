# Imagens de representantes — correção e validação segura

## Armazenamento configurado e limite de execução

A comparação local, sem chamadas à Vercel e sem expor credenciais, confirmou que
`BLOB_READ_WRITE_TOKEN` de `.env.local` é idêntico ao de `.env`, reservado à
produção. Não foi identificado armazenamento exclusivo de desenvolvimento ou
homologação. Nenhum upload, exclusão ou consulta foi feito ao Blob real.

Por autorização do usuário, a validação usa SDK Blob simulado. Upload real em
desenvolvimento permanece bloqueado antes do SDK, inclusive com
`NODE_ENV=production` quando `NOOO_BANCO=local`. Habilitar um ambiente real de
testes depende da identificação e autorização de um Blob exclusivo; nenhuma
configuração de armazenamento ou credencial foi criada ou modificada.

## Causa e alteração

O upload convencional grava no Vercel Blob público e persiste a URL definitiva.
Na Etapa 4, o representante ganhou um desvio local que gravava em `/tmp` e
persistia uma URL de API administrativa. Essa URL não atendia ao cliente
anônimo; arquivos temporários também podiam desaparecer sem remover a URL do
banco.

Foi removida somente a gravação temporária de novos uploads do representante.
O adaptador preserva o ramo existente `put`/`del` do Vercel Blob, `access: public`,
validação de formato/tamanho e compensação por falha transacional. Guards de
produto/fornecedor/representante e persistência das URLs não foram alterados.
O upload convencional e as permissões públicas existentes permaneceram iguais.
A leitura legada das URLs temporárias foi preservada, sem torná-la pública nem
excluir arquivos antigos.

Não foram alterados logística, aba Frete, banco persistente, contas, permissões
ou o produto `ACE-GENE-993`. O arquivo antigo ausente não pode ser reconstruído
a partir da URL; sua recuperação depende do original ou backup e de operação
posteriormente autorizada.

## Testes

- Teste novo do adaptador, com SDK simulado e `fetch` proibido: quatro cenários
  aprovados (cinco registros TAP com o agrupador). Cobre bloqueio local,
  bloqueio de build local em modo produção, validação antes do envio, URL Blob
  definitiva pública e remoção de compensação.
- Regressão existente em PostgreSQL Docker descartável: doze registros TAP
  aprovados. As migrations existentes são usadas somente na fixture descartável;
  nenhuma migration foi criada ou aplicada ao banco persistente.
- A regressão executa a action de upload real com SDK simulado, confere URL
  persistida, leitura real do gestor e consulta pública real sem sessão
  administrativa retornando a mesma URL. Confere também negação a outro
  representante, operações não autorizadas, revogação e o cadastro convencional.
- As URLs `storage.fixture.invalid` são somente resultados do SDK em memória.
  Esses testes não certificam carregamento visual de bytes por uma CDN real ou
  upload real em navegador. Essas validações permanecem pendentes do Blob seguro.
- Typecheck aprovado; ESLint direcionado conferido. O build foi tentado com
  credenciais fictícias e banco local validado, mas a trava oficial recusou a
  execução porque já existe outra instância Next ativa. Esse processo não foi
  encerrado nem sua configuração alterada.

## Arquivos

- `src/features/products/actions/representantes/armazenar-imagem-produto.ts`
- `src/features/products/testes/representantes/armazenamento-blob.testes.ts`
- `src/features/products/testes/representantes/escrita-produtos.integracao.testes.ts`
- Este relatório.

Não houve acesso à produção, commit, push ou deploy. Nenhuma pasta de
armazenamento de imagens foi criada.
