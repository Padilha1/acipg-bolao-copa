# Bolao ACIPG

Monorepo pnpm para o bolao mobile-first da Copa do Mundo 2026.

## Estrutura

- `apps/api`: API Node.js 24 com Fastify, TypeScript, Prisma, MySQL, Zod e dotenv.
- `apps/web`: frontend Vite, React, TypeScript, TanStack Router, TanStack Query, Tailwind, ky e Zod.
- `packages/shared`: schemas Zod e tipos compartilhados entre API e web.

## Requisitos

- Node.js 24+
- pnpm
- MySQL

## Variaveis de ambiente

Crie `apps/api/.env.local` a partir de `apps/api/.env.example`.

```env
DATABASE_URL="mysql://usuario_do_banco:senha_do_banco@host-do-mysql/nome_do_banco"
SESSION_SECRET="change-me-at-least-32-characters"
ADMIN_EMAIL="admin@example.com"
WEB_ORIGIN="http://localhost:5173"
NODE_ENV="development"
PORT="3333"
```

`DATABASE_URL` e a fonte real da conexao MySQL usada pelo Prisma.

Para o frontend, `VITE_API_URL` e opcional. Se nao for definida, usa `http://localhost:3333`.

## Comandos

```bash
pnpm install
pnpm --filter api prisma migrate dev
pnpm --filter api seed:world-cup
pnpm dev
```

Outros comandos:

```bash
pnpm build
pnpm lint
pnpm --filter api prisma generate
```

### Baseline do banco existente

O banco de producao anterior ao Prisma Migrate deve ter a migration inicial
marcada como aplicada uma unica vez. Ela descreve o schema que ja existe e nao
executa `CREATE TABLE` durante o baseline.

```bash
pnpm --filter api prisma migrate resolve --applied 20260628000000_baseline
pnpm --filter api prisma migrate deploy
```

Depois disso, os proximos deploys usam apenas `prisma migrate deploy`.

## Importacao do mata-mata

O importador aceita CSV ou JSON local, alem de URL HTTP configurada por
`--source` ou `KNOCKOUT_BRACKET_SOURCE`.

```bash
pnpm --filter api sync:knockout -- --source prisma/data/knockout.csv --dry-run
pnpm --filter api sync:knockout -- --source prisma/data/knockout.csv
```

Campos aceitos: `externalId`, `phase`, `position`, `startsAt`,
`homeTeamCode`/`awayTeamCode` ou as respectivas origens
`homeSourceExternalId`/`awaySourceExternalId` com outcome `winner` ou `loser`,
alem de `status`, `homeScore`, `awayScore` e `qualifiedTeamCode`.

```csv
externalId,phase,position,startsAt,homeTeamCode,awayTeamCode,homeSourceExternalId,homeSourceOutcome,awaySourceExternalId,awaySourceOutcome,status,homeScore,awayScore,qualifiedTeamCode
R32-01,round_32,1,2026-06-28T19:00:00Z,BRA,GER,,,,,scheduled,,,
R16-01,round_16,1,2026-07-04T19:00:00Z,,,R32-01,winner,R32-02,winner,scheduled,,,
THIRD,third_place,1,2026-07-18T19:00:00Z,,,SEMI-01,loser,SEMI-02,loser,scheduled,,,
```

## Autenticacao

O login inicial e feito com nome + email:

1. `POST /auth/start` recebe `name` e `email`.
2. A API cria ou atualiza o usuario, cria a entry padrao se necessario e seta cookie `httpOnly`.
3. `users.name` e usado no ranking.
'

[![Made in Brazil](https://selo.feitonobrasil.dev.br/en/colorido/1x.svg)](https://feitonobrasil.dev.br)
