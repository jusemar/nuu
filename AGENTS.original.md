

## Developer Commands

```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build
npm run lint    # Run ESLint
npm run start   # Start production server
```

No separate typecheck script - run `npx tsc --noEmit` if needed.

## Database

- **ORM**: Drizzle with PostgreSQL (Neon)
- **Schema**: `src/db/schema.ts` + modular tables in `src/db/table/`
- **Migrations**: `drizzle/` folder

```bash
npx drizzle-kit migrate   # Create migration
npx drizzle-kit push     # Push schema to DB
npx drizzle-kit studio  # Open DB GUI
```

Requires `DATABASE_URL` in `.env`.

## Architecture

- **Routes**: `src/app/` (Next.js App Router)
- **Server Actions**: `src/actions/[action-name]/index.ts`
- **Features**: `src/features/` (business logic)
- **Database tables**: `src/db/table/`
- **UI components**: `src/components/`, `src/shared/ui/`

## Key Patterns

- **Forms**: React Hook Form + Zod → ref: `src/app/authentication/components/sign-in-form.tsx`
- **Server Actions**: Store in `src/actions/[action-name]/index.ts` + `schema.ts` → ref: `src/actions/add-cart-product`
- **Client queries**: TanStack Query → ref: `src/hooks/queries/use-cart.ts`
- **Query keys**: Always export key functions

## Styling

- Tailwind CSS v4
- Custom colors: `primary`, `accent`, `success`, `danger`, `text`, `surface`, `pix`
- Font: Plus Jakarta Sans

## Image Domains

Configured in `next.config.ts`: cloudfront.net, fakestoreapi.com, via.placeholder.com, unsplash.com, *.vercel-storage.com

## Conventions

- kebab-case for files/folders
- No code comments
- shadcn/ui components preferred
- useInfiniteQuery + pushState for infinite scroll
- Server Actions for: login, checkout, CRUD, cart

## Env Required

```
DATABASE_URL          # Neon PostgreSQL
BETTER_AUTH_SECRET   # Better Auth
BETTER_AUTH_URL      # e.g., http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_APP_URL
```

Optional: Google OAuth, Cloudinary, Vercel Blob tokens.