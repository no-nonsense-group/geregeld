# Geregeld — Architecture

Status: Draft  
Last updated: 2026-07-28

## Shape

Geregeld is a modular monolith: one TypeScript application, SQL database, and
deployment. It uses TanStack Start, React, Effect, TanStack Query, and Effect
Schema.

Business code follows domain-driven design and vertical slices. It must remain
independent of React, TanStack, Vercel, providers, and SQL implementations.

```text
React / routes
    → TanStack Query
    → TanStack Start server functions or routes
    → Effect workflows
    → domain model and ports
    → SQL and provider adapters
```

Web boundaries validate and translate. Workflows orchestrate. Domain code owns
business behavior. Adapters handle technology.

## Bounded contexts

| Context | Owns |
| --- | --- |
| Identity | Business-user identity, authentication, and sessions |
| Organizations | Tenants, membership, invitations, roles, configuration, and organization-selected booking rules |
| Scheduling | Services, availability rules, exceptions, and derived candidate slots |
| Bookings | The appointment entity, its state and history, management links, and booking lifecycle workflows |

Identity does not own organization membership. Organizations is the authority
for who may act within a tenant.

Organizations controls how its booking flow works: required information,
booking horizon and notice, confirmation mode, rescheduling and cancellation,
and related constraints. It exposes effective policy through a public
application contract. Booking workflows consume and enforce that policy; the
Booking entity does not own an organization's choices.

A displayed slot is only a candidate. Creating or rescheduling a booking must
revalidate policy and availability and commit atomically. Database transactions
and constraints protect capacity; never implement this as `isAvailable()`
followed by `save()`.

Cross-context calls use explicit public application contracts. A context never
imports another context's infrastructure.

## Code organization

```text
src/
  contexts/
    <context>/
      domain/          # shared within this context only
      application/     # context-wide ports and public contracts
      infrastructure/  # implementations of context-owned ports
      slices/
        <use-case>/
          contract.ts
          workflow.ts
          functions.ts
          query.ts
          view.tsx
          *.test.ts
  platform/             # database, auth, email, runtime, observability
  routes/               # thin route declarations
  shared/               # only genuinely product-wide concepts
```

Start inside a slice. Promote code only after multiple slices genuinely share
it. Do not create empty layers or generic repositories for symmetry.

## Interface rules

Interfaces are designed from use cases, beginning with booking creation.

Each slice should define only what it needs:

- Runtime-validated transport input and serializable output
- Domain values, invariants, and expected errors
- Small capability-oriented ports
- Events that must survive the request
- A thin server adapter

Transport schemas and domain models may differ. Every trust boundary is decoded.
Expected failures are typed; provider and SQL errors never cross a public
contract.

Application workflows depend on ports such as clocks, identifier generators,
policy providers, transactional stores, audit writers, and notification
outboxes. Production Effect layers provide adapters; tests provide deterministic
implementations.

Booking creation must persist the booking, audit information, and durable
notification intent consistently. Email delivery occurs afterward and cannot
roll back a valid booking.

## Data, security, and runtime

- Every tenant-owned operation carries and verifies organization scope.
- Authentication, membership, and authorization are separate checks.
- Route guards improve UX; the server operation is the security boundary.
- Use migrations and decode database results.
- Keep transaction boundaries at the workflow level.
- Use database integrity features where correctness requires them.
- Hash sensitive management tokens; never log tokens or personal data.
- Keep server-only modules out of client bundles.
- Durable work belongs in a durable queue or outbox, not an in-memory fiber.
- Effect runtime composition lives under `platform/runtime/`.

## Testing

Tests follow architectural boundaries:

1. **Domain:** pure invariants, policy decisions, state transitions, time zones,
   daylight-saving transitions, and edge cases.
2. **Workflow:** Effect programs with deterministic clocks, identifiers, and
   small fake ports. Assert typed errors, events, and requested side effects.
3. **Contract:** shared behavioral suites for fake and production adapters.
4. **Database integration:** real PostgreSQL, migrations, transactions,
   constraints, tenant isolation, decoding, and concurrent booking attempts.
5. **Server boundary:** validation, authentication, authorization, safe error
   translation, serialization, and CSRF behavior.
6. **Browser component:** behavior, keyboard use, focus, loading, empty, and
   error states in a real browser.
7. **End to end:** a small set of critical client and admin journeys.

Accessibility combines semantic assertions, keyboard and focus tests, automated
axe checks, and manual screen-reader and zoom/reflow checks. Automated scans are
useful but are not proof of accessibility.

Test through public behavior. Fake ports at architectural boundaries; do not
mock domain internals. The concurrency test must prove simultaneous requests
cannot exceed capacity.

## Open technical decisions

- PostgreSQL hosting, query, and migration tooling
- Authentication provider
- Email provider and durable job mechanism
- Browser and end-to-end test configuration
- Import-boundary enforcement
- Production observability

Dependencies remain exactly pinned while TanStack Start is a release candidate.
Upgrades are explicit maintenance work and must exercise routes, server
functions, hydration, tests, build, and deployment.
