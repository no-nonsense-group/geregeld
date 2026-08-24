# Geregeld

Full-stack scheduling application built with TanStack Start, React,
TypeScript, Effect, TanStack Query, Effect SQL, and shadcn/ui.

Product and technical decisions are documented in:

- [`REQUIREMENTS.md`](./REQUIREMENTS.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)

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

Copy `.env.example` to `.env` when database-backed behavior is introduced.

## License

Geregeld is source-available under the PolyForm Noncommercial
License 1.0.0.

Commercial use, including offering a hosted version, selling the
software, or using it as part of a commercial service, requires a
commercial license from No Nonsense Group.

Contact: danielagg@outlook.com
