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

Copy `.env.example` to `.env` and set the database connection before using the
registration flow.

## License

Geregeld is source-available under the PolyForm Noncommercial License 1.0.0.

Commercial use requires a separate commercial license. See
[`COMMERCIAL_LICENSE.md`](./COMMERCIAL_LICENSE.md) for details.

Contact: danielagg@outlook.com
