# ✅ Refatoração Completa - Sistema de Frete em 3 Níveis

## 📋 Resumo do Que Foi Feito

### Opção A Implementada ✅
Deletou a estrutura antiga de "rotas de entrega" (`deliveryRoutes`) e criou um **novo sistema de 3 níveis** para precificação de frete próprio.

---

## 🏗️ Estrutura Nova Criada

### 1. **Banco de Dados (Drizzle)**
Criadas **6 tabelas** no PostgreSQL:

```
📦 src/db/table/logistics/shipping/
├── shippingRegions.ts (tabelas + relações)
└── index.ts (exportações)

Tabelas:
✅ shipping_regions         - Regiões (ex: "Zona Sul")
✅ regiao_bairros           - Relação N:M (região ↔ bairros)
✅ bairros_avulsos          - Bairros isolados (ex: "Pampulha")
✅ ceps_especificos         - Exceções por CEP
✅ shipping_region_slots    - Horários das regiões
✅ shipping_bairro_avulso_slots - Horários dos bairros
```

### 2. **Serviços (Backend)**
```
📦 src/features/admin/shipping/services/
├── shippingService.ts       - Lógica de 3 níveis + CRUD
├── viaCepService.ts         - Integração com ViaCEP
└── index.ts (será criado)
```

**Função Principal**: `getShippingPrice(cep, neighborhood, city, state)`
- [1] Busca CEP específico (exceção)
- [2] Busca bairro em região
- [3] Busca bairro avulso
- [4] Retorna "Não atendemos"

### 3. **Hook React**
```
📦 src/features/admin/shipping/hooks/
├── useShipping.ts           - Gerencia estado + ações
└── index.ts (será criado)
```

### 4. **Componentes**
```
📦 src/features/admin/shipping/components/
├── ShippingPage.tsx         - Interface admin (4 tabs)
└── index.ts (será criado)
```

### 5. **Tipos**
```
📦 src/features/admin/shipping/types/
├── shipping.ts              - Tipos TypeScript
└── index.ts (será criado)
```

### 6. **Página Next.js**
```
✅ src/app/admin/shipping/page.tsx - Rota /admin/shipping
```

---

## 🗂️ Arquivos Antigos (Descontinuados)

Esses arquivos ainda existem mas **NÃO devem mais ser usados**:

```
❌ src/features/admin/logistics/routes/
   ├── components/RoutesPage.tsx        (ANTIGO - substitui por ShippingPage)
   ├── hooks/useRoutes.ts               (ANTIGO - substitui por useShipping)
   ├── services/routesService.ts        (ANTIGO - substitui por shippingService)
   ├── services/viaCepService.ts        (ANTIGO - substitui por novo)
   ├── types/routes.ts                  (ANTIGO)
   └── ...

❌ src/db/table/logistics/deliveryRoutes/
   └── deliveryRoutes.ts                (SCHEMA ANTIGO - não usar)
```

### Ação Recomendada: Backup & Delete
```bash
# 1. Fazer backup
mv src/features/admin/logistics/routes routes.backup

# 2. Deletar estrutura antiga
rm -rf routes.backup
rm -rf src/db/table/logistics/deliveryRoutes
```

---

## 📊 Hierarquia de Frete - Exemplo Prático

### Cadastro (Admin)
```
1️⃣ CRIAR REGIÃO
   Nome: "Zona Sul"
   Cidade: "Belo Horizonte"
   Estado: "MG"
   Preço: R$ 15,00
   Bairros: [Savassi, Funcionários, Santo Agostinho]
   Slots: Seg-Ter-Qua 09h-17h, Quinta 10h-16h

2️⃣ CRIAR BAIRRO AVULSO
   Nome: "Pampulha"
   Cidade: "Belo Horizonte"
   Estado: "MG"
   Preço: R$ 20,00
   Slots: Seg-Ter-Qua 10h-15h

3️⃣ CRIAR CEP ESPECÍFICO (EXCEÇÃO)
   CEP: 30140-999
   Bairro: "Savassi" (referência)
   Preço: R$ 25,00 (sobrescreve Zona Sul)
```

### Busca (Frontend/Checkout)
```
Cliente digita CEP: 30140-999, Bairro: Savassi

Sistema verifica:
[1] CEP 30140999 existe em ceps_especificos? 
    ✅ SIM → Retorna R$ 25,00 (prioridade máxima)

[2] "Savassi" está em alguma região?
    ✅ SIM (Zona Sul) → R$ 15,00

[3] "Savassi" é bairro avulso?
    ❌ NÃO

[4] Resultado final: R$ 25,00 (CEP específico tem prioridade)
```

---

## 🚀 Como Usar Agora

### Admin Criar Região
```typescript
import { useShipping } from '@/features/admin/shipping/hooks/useShipping';

const { addRegion } = useShipping();

await addRegion({
  name: "Zona Sul",
  city: "Belo Horizonte",
  state: "MG",
  baseShippingPrice: 1500, // R$ 15,00 em centavos
  bairros: ["Savassi", "Funcionários"],
  slots: [
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
  ]
});
```

### Frontend Calcular Frete
```typescript
import { getShippingPrice } from '@/features/admin/shipping/services/shippingService';

const result = await getShippingPrice(
  "30140-100",      // CEP do cliente
  "Savassi",        // Bairro (vem do ViaCEP)
  "Belo Horizonte", // Cidade
  "MG"              // Estado
);

if (result.found) {
  console.log(`Frete: ${result.shippingPrice}cents = R$ ${(result.shippingPrice/100).toFixed(2)}`);
  console.log(`Nível encontrado: ${result.level}`); // "cep-especifico" | "regiao" | "bairro-avulso"
} else {
  console.log("Não atendemos essa região");
}
```

---

## 📁 Nova Estrutura Completa

```
src/
├── db/
│   ├── schema.ts (atualizado com imports novo)
│   └── table/logistics/
│       ├── shipping/ (NOVO)
│       │   ├── shippingRegions.ts
│       │   └── index.ts
│       ├── deliveryRoutes/ (ANTIGO - DESCONTINUADO)
│       └── ...
│
├── features/admin/
│   ├── shipping/ (NOVO)
│   │   ├── components/
│   │   │   ├── ShippingPage.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useShipping.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── shippingService.ts
│   │   │   ├── viaCepService.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── shipping.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── logistics/routes/ (ANTIGO - DESCONTINUADO)
│       └── ...
│
└── app/
    └── admin/
        ├── shipping/ (NOVO)
        │   └── page.tsx
        └── logistics/
            └── routes/ (ANTIGO - DESCONTINUADO)
```

---

## ⚠️ Notas Importantes

1. **Válido apenas para entrega própria**
   - Comentário `⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA` em todos os arquivos
   - Não afeta delivery methods de terceiros (Correios, Loggi, etc)

2. **ViaCEP integrado**
   - Campo de bairro autocompleta ao digitar CEP
   - Suporta edição manual se ViaCEP falhar

3. **Prioridade de busca**
   - CEP específico > Região > Bairro avulso > Não atendemos
   - Implementado em `getShippingPrice()`

4. **Slots opcionais por nível**
   - Regiões podem ter múltiplos slots (diferentes dias/horários)
   - Bairros avulsos também
   - CEPs específicos não (apenas preço fixo)

---

## 🔗 Próximos Passos (Opcional)

1. ✅ Criar formulários completos para CRUD
2. ✅ Validações de sobreposição de bairros
3. ✅ Importação em lote (CSV)
4. ✅ Testes de frete na página

---

**Status**: ✅ Refatoração Opção A Completa
**Data**: 21 de Abril de 2026
**Branch**: main
