# Platz

B2B medical device sales platform — marketing site, customer portal, admin CRM, AI assistant.

Forked from `sienovo-intl` and rebranded.

## Setup

```bash
pnpm install
cp .env.local.example .env.local
# Fill in DATABASE_URL, AUTH0_*, and at least one AI provider key

npx prisma db push    # create tables in your Neon database
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth0 + Microsoft Login

1. Create a new Auth0 tenant (or reuse an existing one)
2. Create a **Regular Web Application**
3. Configure callback URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-prod-domain/auth/callback`
4. Enable the **Microsoft Account** social connection in *Authentication → Social*
5. Copy `Domain`, `Client ID`, `Client Secret` into `.env.local`

The first time `jay.lin@usproglove.com` logs in via Microsoft, they're auto-promoted to `owner` role (see `BOOTSTRAP_OWNERS` in [src/lib/auth0.ts](src/lib/auth0.ts)).

## Stack

- Next.js 16 (App Router)
- Prisma 7 + Neon Postgres
- Auth0 (Microsoft + Google + email)
- Tailwind 4
- AI: Z.AI (free) → DeepSeek → Cerebras fallback chain

## Routes

- `/` — marketing home
- `/products/[slug]` — product detail
- `/blog` — blog
- `/dashboard` — customer portal (tickets, AI chat, profile)
- `/admin` — admin (products, CRM, knowledge base, AI chat, outreach, team)
- `/admin/team` — owner-only team management
