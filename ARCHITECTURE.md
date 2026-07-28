# Geregeld — Architecture

Status: Draft  
Version: 0.1  
Last updated: 2026-07-28

## 1. Decision summary

Geregeld will initially be a single full-stack TypeScript application built
with:

- [TanStack Start](https://tanstack.com/start/latest)
- React
- TypeScript
- Vite
- [Effect](https://www.effect.website/)
- TanStack Query
- A SQL database
- Vercel deployment

The application will follow domain-driven design and vertical-slice
principles. It will be one deployable application, but its business logic
must not be coupled to React, TanStack Start, Vercel, or a specific SQL
provider.

## 2. Why TanStack Start

TanStack Start gives the project a full-stack application boundary while
preserving the React, Vite, TanStack Router, and TanStack Query ecosystem.

It provides:

- Typed file-based routing and URL state
- Server-side rendering and streaming
- Server functions for application-internal operations
- Server routes for externally callable HTTP endpoints
- Middleware for concerns such as authentication and request context
- Integration with TanStack Query hydration and route loaders
- Deployable server output for Vercel through Nitro

This avoids maintaining separate frontend and backend projects before there
is a concrete need for independent deployment or scaling.

TanStack Start is currently a release candidate. Until it reaches a stable
release:

- Pin Start, Router, Query integration, and Nitro dependencies to exact
  versions.
- Review release notes before upgrading.
- Treat framework upgrades as explicit maintenance work.
- Exercise important routes, loaders, server functions, and deployment after
  each upgrade.

## 3. Architectural style

### 3.1 Domain-driven design

The codebase should reflect the product's business language and boundaries.
Business concepts such as organizations, availability, services, slots, and
bookings should be modeled explicitly rather than represented as generic
CRUD records.

The current terminology in `REQUIREMENTS.md` remains provisional. Once
terminology is chosen, the same names should be used consistently in code,
tests, database concepts, and technical documentation.

Domain code should:

- Express business invariants directly.
- Use domain-specific types instead of unvalidated primitives where useful.
- Represent expected failures as typed errors.
- Remain independent from React, TanStack Start, TanStack Query, SQL clients,
  email providers, and deployment APIs.
- Be testable without starting a server or connecting to external services.

### 3.2 Vertical slices

The primary unit of organization is a business capability or use case, not a
technical layer.

For example, “create booking”, “cancel booking”, and “change recurring
availability” are slices. Each slice owns the code needed to deliver that
behavior, including its input contract, application workflow, server adapter,
client integration, and tests.

Shared domain concepts may live at the bounded-context level when several
slices genuinely use them. Code should not be moved to a global shared
folder merely because two files look similar.

### 3.3 Modular monolith

The first version will be a modular monolith:

- One repository
- One full-stack application
- One deployment
- One SQL database
- Explicit internal module boundaries

This keeps development and operations simple while allowing a module to be
extracted later if independent deployment becomes valuable.

Splitting into services is not an initial goal. Module boundaries should be
defined by business ownership and invariants, not by an expectation that
every module will eventually become a microservice.

## 4. Runtime responsibilities

```text
React components
        |
TanStack Query and route loaders
        |
TanStack Start server functions/routes
        |
Effect application workflows
        |
Domain model and repository/service ports
        |
SQL, email, authentication, and other adapters
```

### 4.1 TanStack Start

TanStack Start owns the web boundary:

- Routes and layouts
- Request and response handling
- SSR
- Server functions
- Server routes
- Authentication middleware
- Translation between web concerns and application inputs/outputs

Route files and server functions should remain thin. They validate input,
establish authenticated context, invoke an application workflow, and translate
the result into a serializable response.

### 4.2 Effect

Effect owns application execution:

- Use-case orchestration
- Typed errors
- Dependency definitions
- Resource management
- Configuration
- Retries and timeouts where appropriate
- Logging, tracing, and metrics
- Test implementations of dependencies

Most business workflows should return an `Effect`. At a TanStack Start server
boundary, the Effect program is provided with its required layers and
executed as a promise.

Conceptually:

```ts
const result = await runtime.runPromise(applicationWorkflow(input))
```

Effect should not be introduced into every React component merely for
consistency. React and TanStack Query remain the natural client-side
abstractions. Effect belongs primarily in domain, application, infrastructure,
and server-boundary code, with shared Effect Schema definitions where useful.

### 4.3 Effect Schema

Effect Schema should be the default validation and domain-schema library.

Schemas may be shared for:

- Route search parameters
- Server-function inputs and outputs
- Form submission data
- Configuration
- Database-boundary decoding
- Public API payloads

Crossing a trust boundary always requires runtime validation. Compile-time
types alone are not sufficient.

Transport schemas and domain models do not have to be identical. A transport
schema may accept strings or optional fields and then decode them into stricter
domain types.

### 4.4 TanStack Query

TanStack Query owns asynchronous server state in React:

- Fetching and caching
- Mutations
- Invalidation
- Loading and error state
- SSR dehydration and hydration

Route loaders may prefetch essential query data. Components should then read
that data through Query. Avoid separately caching the same entity in both
arbitrary component state and TanStack Query.

Query functions call server functions or server routes; they do not access
repositories or the database directly.

## 5. Proposed folder structure

The exact names can evolve as bounded contexts become clearer. The intended
shape is:

```text
src/
  routes/
    __root.tsx
    index.tsx
    admin/
    public/

  contexts/
    identity/
      domain/
      application/
      infrastructure/
      slices/
        register-business-user/
        invite-organization-member/

    organizations/
      domain/
      application/
      infrastructure/
      slices/
        create-organization/
        update-organization-settings/

    scheduling/
      domain/
      application/
      infrastructure/
      slices/
        define-recurring-availability/
        add-availability-exception/
        list-available-slots/

    bookings/
      domain/
      application/
      infrastructure/
      slices/
        create-booking/
        reschedule-booking/
        cancel-booking/
        get-booking-by-management-token/

  platform/
    auth/
    database/
    email/
    observability/
    runtime/

  shared/
    domain/
    schema/
    ui/

  router.tsx
  start.ts
```

The folders have these responsibilities:

- `routes/`: TanStack route declarations and layout composition. Route files
  delegate behavior to slices.
- `contexts/`: Business capabilities and their explicit boundaries.
- `domain/`: Entities, value objects, domain services, policies, invariants,
  and domain errors shared within one context.
- `application/`: Context-wide ports and coordination used by multiple
  slices.
- `infrastructure/`: Implementations of context-owned ports, such as SQL
  repositories.
- `slices/`: End-to-end use cases, grouped by user intent.
- `platform/`: Technical capabilities shared by contexts and wired into
  Effect layers.
- `shared/domain/`: Only concepts that truly belong to the whole product.
- `shared/schema/`: Stable cross-context primitives, not a dumping ground for
  miscellaneous validation.
- `shared/ui/`: Reusable presentational components with no business rules.

### 5.1 Example slice

An individual slice should be cohesive and may look like:

```text
contexts/bookings/slices/create-booking/
  contract.ts
  workflow.ts
  server.ts
  query.ts
  form.tsx
  workflow.test.ts
  server.test.ts
```

Not every slice needs every file:

- `contract.ts` defines validated input and serializable output.
- `workflow.ts` implements the Effect application workflow.
- `server.ts` exposes the workflow through a server function or route.
- `query.ts` defines TanStack Query options or a mutation.
- `form.tsx` contains slice-specific UI.
- Tests remain beside the behavior they verify.

If a slice grows substantially, it may use subfolders. Avoid creating empty
layer folders simply to satisfy a template.

## 6. Dependency rules

Dependencies point inward toward business behavior:

```text
presentation/web → application → domain
infrastructure   → application/domain
composition root → all concrete implementations
```

The following rules apply:

1. Domain code cannot import from React, TanStack, a SQL client, Vercel, or a
   provider SDK.
2. Application workflows depend on ports, not concrete adapters.
3. Infrastructure implements ports defined by the context that needs them.
4. React components and routes cannot access the database directly.
5. Server functions cannot contain substantial business rules.
6. One bounded context cannot reach into another context's infrastructure.
7. Cross-context behavior goes through an explicit public application
   contract.
8. Shared code must have a clear owner and reason to be shared.
9. Server-only modules must be explicitly protected from inclusion in the
   client bundle.
10. Critical invariants that require concurrency safety are also enforced by
    database transactions or constraints.

These rules should eventually be reinforced with import conventions, lint
rules, and tests rather than relying only on documentation.

## 7. Composition and dependency injection

Effect services and layers will form the dependency-injection mechanism for
server-side workflows.

Examples of ports include:

- Organization repository
- Availability repository
- Booking repository
- Email sender
- Clock
- Identifier generator
- Authentication/session service
- Audit-log writer

Production layers provide SQL and provider-backed implementations. Test layers
provide deterministic in-memory or fake implementations.

Runtime construction belongs in a server-only composition root under
`platform/runtime/`. It must account for Vercel's execution model:

- Warm function instances may reuse module-level resources.
- No workflow may rely on process memory surviving another request.
- Database connections must use serverless-appropriate pooling.
- Durable background work must be handed to an external durable mechanism.
- Long-lived Effect fibers are not a substitute for a job queue.

## 8. Data and transaction boundaries

Repositories provide persistence abstraction, but abstraction must not weaken
correctness.

- Use SQL migrations.
- Decode database results before treating them as domain values.
- Keep transaction boundaries at the application-workflow level when a use
  case must change several records atomically.
- Enforce tenant ownership in every tenant-scoped operation.
- Prevent overbooking using database-supported concurrency control and
  constraints where practical.
- Do not promise complete database portability. Isolate vendor-specific code
  while using the selected database's integrity features.

The database provider and query/migration tooling remain open decisions.

## 9. Authentication and tenant context

Authentication and tenant authorization are separate concerns:

- Authentication determines the business user's identity.
- Membership determines which organizations that user may access.
- Authorization determines which actions the membership role permits.

An organization identifier received from the browser is untrusted input.
Server middleware may establish a request context, but every protected use
case must authorize access before reading or changing organization data.

Route guards improve navigation and user experience; they are not the security
boundary.

Client magic-link access should enter through a dedicated booking-management
slice and expose only the minimum booking data and actions allowed by policy.

## 10. Errors

Expected failures should use explicit domain or application error types, for
example:

- `SlotNoLongerAvailable`
- `CancellationWindowClosed`
- `OrganizationAccessDenied`
- `BookingNotFound`
- `ManagementTokenInvalid`

At the server boundary, these errors are translated into safe serializable
responses or appropriate HTTP responses. Defects and unexpected failures are
logged with diagnostic context but returned to clients as generic errors.

Provider and SQL errors should not leak through public contracts.

## 11. Testing strategy

Tests should follow the same architectural boundaries:

- Domain tests for invariants and policy calculations
- Workflow tests using deterministic Effect test layers
- Repository integration tests against the selected SQL database
- Server-boundary tests for validation, authentication, and error translation
- React tests for meaningful interaction behavior
- End-to-end tests for critical journeys

Time-dependent workflows should depend on an injectable clock. Scheduling
tests must cover organization time zones and daylight-saving transitions.

The booking workflow requires a concurrency test proving that simultaneous
requests cannot exceed slot capacity.

## 12. Initial scaffolding scope

The initial scaffold should establish only:

- TanStack Start with React, TypeScript, and Vite
- TanStack Query integration
- Effect and Effect Schema
- Formatting, linting, type-checking, and testing
- The top-level architectural folders
- A server-only Effect runtime/composition-root pattern
- One trivial vertical slice demonstrating the boundaries without introducing
  product behavior
- A production build compatible with Vercel

Database, authentication, email, styling, and product-specific modules should
be selected or implemented through separate decisions.

## 13. Decisions still required

- Package manager and Node.js version
- SQL database provider
- SQL query and migration tooling
- Authentication provider or implementation
- Email provider
- Durable job and reminder mechanism
- Styling and component approach
- Test runner and browser end-to-end tooling
- Formatting and linting tools
- Whether the initial bounded contexts above match the first product slice

