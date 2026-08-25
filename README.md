# Geregeld

Geregeld is scheduling software for independent professionals and small service
businesses. Owners publish services and availability. Clients book and manage
appointments without creating an account.

## Documentation

The documentation is deliberately small:

- [`GLOSSARY.md`](./GLOSSARY.md) defines the product's shared language.
- [`docs/adr/`](./docs/adr/) records decisions that are expensive to reverse
  and hard to understand from the code alone.

Current behavior belongs in the code and tests, not in a parallel specification.

## Development

The project uses Bun for package management and Node 24 for the TanStack Start
runtime. Select the repository's Node version, install
dependencies, and start the development server:

```sh
nvm install
nvm use
bun install
bun run dev
```

The application is available at `http://localhost:3000`.

Other Node major versions are rejected so local development and CI use the same
Node 24 runtime. The production target must support Node 24.

## Quality checks

```sh
bun run quality
```

Every project script checks for Node 24 before invoking its tool.

Copy `.env.example` to `.env` and set the database connections before using the
identity flows. The application uses `DATABASE_URL`; Drizzle Kit uses
`DATABASE_URL_UNPOOLED` so schema migrations bypass the connection pool.

Production registration and login emails use Resend. Set `RESEND_API_KEY` and
`RESEND_FROM_EMAIL` in Vercel after verifying the sender domain in Resend.
`REGISTRATION_CODE_SECRET` secures both kinds of code and must contain a
separate random value of at least 32 characters. Local development shows the
code in the browser and does not call Resend.

Vercel runs pending migrations after a successful production build and before
publishing the deployment. Preview builds skip migrations. The deployment fails
if the direct database connection is missing or a migration fails.

Deploy production from the production branch rather than promoting a preview
deployment when migrations are pending. Vercel promotions reuse the preview
build, so they do not run the production build command again. Keep migrations
compatible with the currently deployed application until the new deployment is
published.

For local database work, apply pending migrations before starting the app:

```sh
bun run db:migrate
```

The TypeScript schema in `src/platform/database/schema.ts` is the source of
truth. After changing it, generate and review a migration:

```sh
bun run db:generate
bun run db:check
```

## License

Geregeld is source-available under the PolyForm Noncommercial License 1.0.0.

Commercial use requires a separate commercial license. See
[`COMMERCIAL_LICENSE.md`](./COMMERCIAL_LICENSE.md) for details.

Contact: danielagg@outlook.com
