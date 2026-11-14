# PATA — People's Opportunity Network

A deployable MVP for a community opportunity board. People can register, publish jobs/services/help requests/exchanges/opportunities, respond to listings, manage responses and report suspicious listings. Includes a small admin moderation overview.

## Important scope

This is an operational **MVP**, not a complete escrow, employment, identity-verification or mobile-money platform. It does not collect KSh 1 payments or send payouts. Add a properly approved payment provider and its server-side credentials before enabling payments. The pilot is free to join and post.

## Requirements

- Node.js 20+
- A free Cloudflare account
- Cloudflare Pages project
- Cloudflare D1 database

## Run locally

```bash
npm install
npm run dev
```

The local Vite server displays the frontend. API calls require a Cloudflare Pages Functions runtime with D1; use `npx wrangler pages dev dist` after building and configuring D1 for a full local integration test.

## Deploy to Cloudflare Pages

1. Create a D1 database named `pata-production` in Cloudflare.
2. Copy its database ID into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
3. Apply the migration:

```bash
npx wrangler d1 migrations apply pata-production --remote
```

4. Push this project to a new GitHub repository.
5. In Cloudflare Pages, create a project connected to that repository.
6. Set build command to `npm run build` and build output directory to `dist`.
7. In Pages > Settings > Functions > D1 database bindings, bind variable `DB` to your `pata-production` database. If using Wrangler configuration, confirm the D1 binding is shown in the deployed Pages project.
8. Redeploy after binding the database.

## Make the first administrator

1. Register your own account through the deployed site.
2. In Cloudflare dashboard, open D1 > `pata-production` > Console.
3. Run this SQL, replacing the email with the exact email you registered:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

4. Sign out and sign back in.

Admin API: `GET /api/admin/overview`. The MVP does not yet include a full admin dashboard screen; use the endpoint and D1 console for pilot moderation. Do not expose admin credentials or D1 access.

## Security and production checklist

- Keep Cloudflare HTTPS enabled.
- Use a strong unique password (minimum 10 characters).
- Add rate limiting / bot protection before public marketing.
- Add email verification and password reset before broad launch.
- Add a moderation workflow and privacy/terms pages before onboarding strangers at scale.
- Add M-Pesa or another payment provider only after obtaining merchant credentials; never put secret keys in frontend code.
- Review local data protection, consumer and tax obligations for each country you operate in.

## API routes

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/listings`, `POST /api/listings`
- `GET /api/listings/:id`, `PATCH /api/listings/:id`
- `GET /api/applications`, `POST /api/applications`, `PATCH /api/applications`
- `POST /api/reports`
- `GET /api/admin/overview`, `POST /api/admin/promote`

## Current pilot rules

- Free registration and free listings.
- Users may apply once to each open listing.
- Listing owner can accept/decline responses.
- Listing owners can pause, close or remove their listings.
- Admin role can inspect basic totals and reports.
