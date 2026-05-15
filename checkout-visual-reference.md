# Referência Visual do Checkout - Projeto Nuu

## 1. Contexto do Projeto

**Projeto:** Nuu - Loja Virtual
**Stack:** Next.js 14 (App Router), React Hook Form, Zod, shadcn/ui, Tailwind CSS
**Arquitetura:** Feature-based (feature checkout em `src/features/checkout/`)
**Designer System:** shadcn/ui customizado com paleta própria

---

## 2. Design System

### Paleta de Cores (CSS Variables - light mode)

```css
/* Primária: #0C447C - azul corporativo */
--primary: oklch(0.385 0.11 253.2);
--primary-foreground: oklch(1 0 0);

/* Hover / secundária: #1E3A8A */
--primary-hover: oklch(0.379 0.138 265.5);

/* Azul claro: #EFF6FF */
--primary-light: oklch(0.97 0.014 254.7);

/* Destaque: #EF9F27 - âmbar */
--accent-brand: oklch(0.764 0.154 70.8);
--accent-brand-dark: oklch(0.555 0.145 49.0);
--accent-brand-light: oklch(0.987 0.021 95.3);

/* Sucesso: #14B8A6 - teal */
--success: oklch(0.704 0.123 182.5);
--success-light: oklch(0.984 0.014 181.1);
--success-dark: oklch(0.511 0.086 186.4);

/* Fundo: #F8F8F6 */
--background: oklch(0.979 0.003 107.2);

/* Texto: #1F2937 */
--foreground: oklch(0.278 0.03 256.9);

/* Cards: #FFFFFF */
--card: oklch(1 0 0);
--card-foreground: oklch(0.278 0.03 256.9);

/* Muted: #6B7280 */
--muted: oklch(0.97 0.003 264.5);
--muted-foreground: oklch(0.551 0.023 264.4);

/* Erro: #DC2626 */
--destructive: oklch(0.577 0.215 27.3);

/* Bordas: #E5E7EB */
--border: oklch(0.928 0.006 264.5);
--input: oklch(0.945 0.004 264.5);
```

### Tailwind Colors Disponíveis

| Cor | Hex | Uso |
|-----|-----|-----|
| `primary` | `#0C447C` | Botões principais, links |
| `primary-light` | `#EFF6FF` | Fundos de elementos selecionados |
| `accent` / `accent-brand` | `#EF9F27` | Destaques, urgência |
| `accent-light` | `#FFFBEB` | Fundos de destaque |
| `success` | `#14B8A6` | Sucesso, confirmações |
| `success-light` | `#F0FDFA` | Fundos de sucesso |
| `destructive` | `#DC2626` | Erros, ações perigosas |
| `text-primary` | `#1F2937` | Texto principal |
| `text-muted` | `#6B7280` | Texto secundário |
| `surface-bg` | `#F8F8F6` | Fundo da página |
| `surface-card` | `#FFFFFF` | Fundo de cards |

### Tipografia

- **Fonte principal:** Plus Jakarta Sans
- **Classes:** `font-sans` (já configurado no Tailwind)
- **Tamanhos:** Use `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`

### Breakpoints

```typescript
sm: '640px'
md: '768px'
lg: '1024px'
xl: '1280px'
2xl: '1536px'
```

---

## 3. Componentes shadcn/ui Disponíveis

### Input (base)

```tsx
// Props disponíveis
<Input
  type="text" | "email" | "tel" | "number"
  placeholder="..."
  className="..."
  id="..."
  autoComplete="..."
/>

// Estilo base (h-9, border rounded-md, focus ring)
```

### Button

```tsx
// Variantes
<Button variant="default">     // primary (fundo azul)
<Button variant="outline">    // borda + fundo
<Button variant="secondary">  // fundo cinza
<Button variant="ghost">      // sem borda
<Button variant="destructive">// vermelho

// Tamanhos
<Button size="default"> // h-9
<Button size="sm">     // h-8
<Button size="lg">     // h-10
<Button size="icon">  // size-9 (quadrado)
```

### Card

```tsx
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
// Estilo: rounded-xl, border, shadow-sm, py-6
```

### Label

```tsx
<Label htmlFor="id">Texto</Label>
// Estilo: text-sm, font-medium, leading-none
```

### Separator

```tsx
<Separator />
// Estilo: h-px, bg-border, my-4
```

---

## 4. Layout Atual do Checkout (JSX Visual)

```tsx
<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
  {/* Header */}
  <div className="mb-8">
    <h1 className="text-2xl font-semibold tracking-normal text-foreground">
      Checkout
    </h1>
    <p className="mt-2 text-sm text-muted-foreground">
      Confirme frete, cupom e total antes de ir para o pagamento.
    </p>
  </div>

  {/* Grid: Formulário + Resumo */}
  <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">

    {/* Coluna Esquerda: Formulário */}
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="space-y-8">

        {/* SEÇÃO 1: Identificação */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Identificação
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usaremos estes dados para enviar informações do pedido.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nome - full width */}
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                placeholder="Seu nome completo"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
            </div>

            {/* CPF/CNPJ - full width */}
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="documento">CPF ou CNPJ</Label>
              <Input
                id="documento"
                placeholder="CPF ou CNPJ"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* SEÇÃO 2: Endereço */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Endereço de entrega
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O frete é estimado para o checkout visitante.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-6">
            {/* CEP */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                autoComplete="postal-code"
              />
            </div>

            {/* Rua */}
            <div className="space-y-2 sm:col-span-4">
              <Label htmlFor="rua">Rua</Label>
              <Input
                id="rua"
                placeholder="Nome da rua"
                autoComplete="address-line1"
              />
            </div>

            {/* Número */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                placeholder="Número"
              />
            </div>

            {/* Complemento */}
            <div className="space-y-2 sm:col-span-4">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                placeholder="Apartamento, bloco, etc."
              />
            </div>

            {/* Bairro */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                placeholder="Seu bairro"
              />
            </div>

            {/* Cidade */}
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                placeholder="Sua cidade"
                autoComplete="address-level2"
              />
            </div>

            {/* UF */}
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="estado">UF</Label>
              <Input
                id="estado"
                placeholder="UF"
                maxLength={2}
                autoComplete="address-level1"
              />
            </div>

            {/* Observação */}
            <div className="space-y-2 sm:col-span-6">
              <Label htmlFor="observacao">Observação para entrega</Label>
              <Input
                id="observacao"
                placeholder="Ex: portaria, ponto de referência, vizinho"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* SEÇÃO 3: Frete (opcional - implementação simplificada) */}
        <section>
          {/* Opções de frete aqui */}
        </section>

        <Separator />

        {/* SEÇÃO 4: Pagamento (opcional - implementação simplificada) */}
        <section>
          {/* PIX / Cartão aqui */}
        </section>

      </div>
    </div>

    {/* Coluna Direita: Resumo do Pedido */}
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      {/* Itens do carrinho, totais, cupom, botão finalizar */}
    </div>

  </form>
</main>
```

---

## 5. Componente CampoPremium (Custom)

Existe um componente customizado que já dá feedback visual:

```tsx
// Estrutura atual do CampoPremium
<div className="space-y-2">
  <Label htmlFor={id}>{label}</Label>
  <div className="relative">
    <Input
      id={id}
      className={cn(
        "h-11 rounded-lg pr-10 transition-all duration-200 focus-visible:ring-2",
        mostrarSucesso && "border-emerald-300 bg-emerald-50/40 focus-visible:border-emerald-500",
        mostrarErro && "border-red-300 bg-red-50/40 focus-visible:border-red-500"
      )}
      // ...props
    />
    <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
      {mostrarSucesso && <CheckCircle2 className="size-4 text-emerald-600" />}
      {mostrarErro && <AlertCircle className="size-4 text-red-600" />}
    </div>
  </div>
  <div className="min-h-4">
    {mostrarErro && <p className="text-xs text-red-600">{error}</p>}
    {mostrarSucesso && <p className="text-xs text-emerald-700">{successMessage}</p>}
  </div>
</div>
```

---

## 6. Requisitos para Melhoria Visual

### O que manter:
- React Hook Form + Zod (lógica de validação)
- Máscaras em tempo real (CPF, CNPJ, telefone)
- Validação real de dígitos verificadores
- shadcn/ui + designer system atual
- Layout responsivo (grid com sidebar)
- Funcionalidade de buscar CEP

### O que melhorar (sugestões):
- Animações mais suaves nas transições de foco
- Feedback visual premium (como Stripe/Mercado Pago)
- Experiência mobile otimizada
- Micro-interactions durante digitação
- Estados de erro mais elegantes
- Transições nos campos ao validar

### Referências de estilo:
- Stripe Checkout
- Mercado Pago Checkout
- Shopify Checkout

---

## 7. Como Implementar

1. Substituir os componentes de formulário pelo novo design
2. Manter a mesma estrutura de dados (schema Zod unchanged)
3. Manter as máscaras e validações (já funcionam)
4. Melhorar apenas a camada visual/UX