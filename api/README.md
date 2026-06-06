# Unbound API

Hono Worker API backed by Cloudflare D1 and Drizzle ORM.

## Commands

```bash
pnpm dev:api
pnpm --filter unbound-api typecheck
pnpm --filter unbound-api db:generate
pnpm --filter unbound-api db:migrate:local
pnpm --filter unbound-api deploy:staging
pnpm --filter unbound-api deploy:production
```

`dev` runs local D1 migrations before starting Wrangler with `--env-file=.env`. Local API secrets belong in `api/.env`; do not use `api/.dev.vars`. `deploy:staging` and `deploy:production` run their matching remote D1 migrations before deploying the Worker.

## Docs

When the Worker is running:

- Scalar: `/docs`
- Swagger UI: `/swagger`
- OpenAPI JSON: `/openapi.json`

## D1 Setup

Create separate production and staging D1 databases, then replace the placeholder `database_id` values in `api/wrangler.jsonc`.

```bash
pnpm --filter unbound-api wrangler d1 create unbound-api
pnpm --filter unbound-api wrangler d1 create unbound-api-staging

pnpm --filter unbound-api deploy:staging
pnpm --filter unbound-api deploy:production
```

The API uses a `DB` binding. No D1 binding or database credential should be added to the website SSR app.
