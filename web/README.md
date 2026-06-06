# Unbound Web

TanStack Start SSR website for the Unbound experience.

## Commands

```bash
pnpm dev:web
pnpm --filter unbound-web build
pnpm --filter unbound-web typecheck
pnpm --filter unbound-web deploy:staging
pnpm --filter unbound-web deploy:production
```

## Current Surface

The web app is intentionally empty right now. The only route is `/`, and it renders no UI.

## Secret Boundary

Do not add provider API keys, D1 bindings, database URLs, or other secrets to this SSR app. Database-backed and secret-backed server behavior belongs in the `api` workspace package.

The website may call public API endpoints over HTTP in future UI, but Cloudflare bindings and secret environment variables should stay out of `web/wrangler.jsonc` and `web/src`.
