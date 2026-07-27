# Buy Box — laboratório de UX da PDP

Escopo: somente `/pre-visualizacao/produto/[slug]`. Este documento descreve uma
hipótese visual; ele não altera regras de produto, preço, estoque, frete,
carrinho ou checkout.

## Problemas encontrados

1. A Buy Box se apresentava como uma sequência de módulos independentes. Isso
   tornava preço, modalidade, frete e confiança visualmente concorrentes, em
   vez de etapas da mesma decisão.
2. A condição PIX aparecia em mais de um lugar e a frase sobre o preço final
   repetia o que o número e o rótulo já comunicavam.
3. O progresso de frete e o cálculo de CEP não estavam suficientemente
   agrupados: o cliente precisava interpretar duas áreas para responder à
   mesma pergunta, “como e quando recebo?”.
4. Quantidade e ações de compra não tinham um encerramento claro; cupom e
   sinais de confiança ficavam desconectados da decisão.
5. O excesso de superfícies aninhadas reduzia a hierarquia e fazia a Buy Box
   parecer uma coleção de cards, não uma experiência de compra.

## Decisão de experiência

A Buy Box agora é uma única superfície com oito momentos ordenados:

1. condição de preço;
2. modalidade escolhida;
3. progresso de frete;
4. cálculo de entrega por CEP;
5. banner promocional demonstrativo;
6. disponibilidade real;
7. cupom;
8. quantidade e ações de compra;
9. reforços de confiança.

O conteúdo acima da Buy Box prepara a decisão com identificação do produto,
descrição curta e um banner promocional demonstrativo. O banner não declara uma
promoção real e serve apenas para validar a ocupação e a hierarquia visual.

## Justificativas de UX

- **Hierarquia visual e escaneabilidade:** o preço é a primeira informação da
  superfície, sem card interno competitivo, repetição de desconto ou texto
  explicativo redundante.
- **Lei da proximidade e Gestalt:** modalidade fica próxima do preço, enquanto
  frete progressivo e CEP se tornam uma única etapa de entrega.
- **Progressive disclosure e Hick’s Law:** a pessoa vê primeiro a condição
  comercial principal; os detalhes de entrega são acionáveis apenas quando
  precisa informar o CEP, reduzindo escolhas simultâneas.
- **Information scent:** títulos e textos curtos (“Modalidade de preço”,
  “Calcular frete”, “Frete grátis acima de…”) antecipam claramente o resultado
  esperado de cada ação.
- **Fitts’s Law e conversão:** os CTAs ficam juntos, com área ampla, depois de
  quantidade e entrega, momento em que a pessoa já possui as informações
  necessárias para agir. Em telas amplas, a quantidade fica ao lado dos CTAs:
  a correção e a ação permanecem no mesmo campo visual. Em mobile ela fica
  acima, evitando alvos de toque comprimidos.
- **Progressive trust:** disponibilidade real aparece imediatamente antes da
  ação para reduzir incerteza. Cupom entra antes dos CTAs porque pode elevar o
  valor percebido; devolução, garantia e compra segura permanecem como reforço
  posterior, sem roubar atenção do preço.
- **Contraste proporcional:** o banner promocional vem depois da entrega e
  antes da decisão. Assim funciona como estímulo comercial quando o cliente já
  sabe que pode receber o produto, sem competir com o preço no topo.
- **Ritmo visual e similaridade:** bordas horizontais discretas e espaçamento
  uniforme separam estágios sem transformar cada um em um card pesado.

## Componentes exclusivos da prévia

- `BannerPromocionalPrevisualizacao`: espaço de campanha visual, explicitamente
  demonstrativo.
- `ProgressoFretePrevisualizacao`: visualização de progresso usada apenas sem
  uma cotação oficial; a cotação real continua tendo precedência.
- `BeneficiosProdutoPdp` e `ItemBeneficioProdutoPdp`: lista de confiança com
  variantes semânticas fechadas e ícones Lucide consistentes.

## Hierarquia de cor e superfícies

- **Preço PIX:** `primary-light` como superfície e `primary/20` como borda de
  separação. O valor continua em `foreground`, enquanto o rótulo PIX usa
  `success`. Assim a condição financeira é a primeira leitura sem usar uma cor
  saturada no número.
- **CTA principal:** `primary` com `primary-foreground`. É a única superfície
  sólida de ação, preservando a maior prioridade depois do preço.
- **Frete pendente:** `muted` e `border` para a superfície, `accent-brand` na
  barra e `accent-brand-dark` no ícone. O âmbar comunica progresso comercial
  sem assumir o mesmo peso visual do preço. Quando atingido, o componente muda
  para `success-light`, `success` e `success/30`.
- **Banner promocional:** `accent-brand-light`, `accent-brand/30` e
  `accent-brand-dark`. A identidade comercial é distinta de preço e frete,
  mas sua luminosidade reduzida mantém o foco no CTA.
- **Informações neutras:** `card`, `foreground`, `muted-foreground` e `border`.
  Esses tokens sustentam modalidade, CEP e benefícios sem criar novas cores.

Os tokens possuem valores próprios em light e dark mode. A composição não usa
cores literais na prévia; no dark, `primary-light`, `accent-brand-light`,
`success-light`, `muted`, `card` e `border` trocam para suas superfícies escuras
correspondentes.

## Pontos para evoluir antes da aprovação

1. Validar a mensagem e o gatilho reais de campanha promocional para substituir
   o banner demonstrativo sem criar promessa comercial indevida.
2. Testar com imagens, avaliações e descrições reais mais completas; o produto
   atual não possui foto nem uma descrição curta representativa.
3. Fazer teste de usabilidade com variantes reais e CEP válido para avaliar se
   a modalidade deve permanecer antes ou depois do preço em categorias cujo
   valor varia muito.
4. Definir, com dados reais de logística, quais estados de frete merecem uma
   barra de progresso e quais devem mostrar somente prazo e preço de entrega.
