# Geregeld — Product requirements

Status: Draft  
Last updated: 2026-07-28

## Product

Geregeld is simple, affordable scheduling software for independent
professionals and small and medium-sized service businesses. Business users
publish availability and manage appointments; clients book and manage an
appointment without creating an account.

Initial non-goals include billing, payments, native apps, marketplace discovery,
external calendars, point-of-sale integrations, and complex resource
optimization.

## Language

| Internal term | Meaning |
| --- | --- |
| Organization | A business or independently managed tenant |
| Business user | An authenticated user with organization access |
| Client | A person making a booking without an account |
| Service | Something a client can book |
| Availability | Rules and exceptions that determine possible times |
| Slot | A derived candidate time; not guaranteed until committed |
| Booking | The appointment and the client's claim on a time |

“Booking” is the provisional stable internal term. Organizations may configure
client-facing labels without changing code or database terminology.

The platform UI initially supports Dutch and English. Organizations may store
their own labels in any configured language; these labels do not replace or
extend the platform translation catalog.

## Ownership and access

- **Owner:** full organization control, including settings and membership.
- **Admin:** operational control, excluding ownership-only actions.
- **Staff:** later, with narrower permissions.
- **Client:** public booking access plus a secure management link.

Identity owns authentication. Organizations owns invitations, membership,
roles, tenant authorization, and configuration.

Every organization operation must verify membership and permission server-side.
Every tenant-owned record belongs directly or transitively to one organization.
Public endpoints expose no other clients' data or sensitive tenant information.

## Organization control

An organization controls:

- Profile, branding, time zone, public slug, and client-facing terminology
- Services and availability
- Required client information
- Booking horizon and minimum notice
- Immediate confirmation or approval, when supported
- Rescheduling and cancellation permissions and cutoffs
- Service-specific overrides
- Email behavior within provider capabilities

These choices form the effective booking policy. Booking workflows enforce the
policy at submission time and retain a snapshot or sufficient history for
explanation and audit. A Booking represents the appointment; it does not decide
which rules an organization offers or enables.

## Core behavior

### Configure scheduling

- Create fixed-duration services with optional buffers and instructions.
- Define recurring weekly availability with effective dates.
- Add one-time openings and closures.
- Derive slots using time zone, duration, buffers, policy, existing bookings,
  and capacity.
- Handle daylight-saving transitions explicitly.

Availability may eventually be scoped to organization, service, staff, or
resource. The first-release scope remains open.

### Create a booking

1. The client selects a service and candidate slot.
2. The client supplies the organization's required information.
3. The server revalidates policy and availability.
4. The booking is created atomically; concurrent requests cannot exceed
   capacity.
5. The client sees confirmation.
6. Durable email delivery sends a secure management link.

Publicly displayed availability is never a guarantee. Temporary email failure
must not roll back a valid booking.

### Manage a booking

- A secure, revocable management token reveals only the required booking data.
- Clients may reschedule or cancel when current policy permits.
- Policy and availability are revalidated when an action is submitted.
- Business users may manage bookings when authorized.
- Important changes and any future policy overrides are audited.

Raw management tokens should not be stored. Expiry behavior remains an open
decision.

### Admin experience

- Day and week views show availability, bookings, closures, and cancellations
  in the organization time zone.
- Views work on common mobile and laptop sizes.
- Users may filter by service and later by staff or resource.
- Loading, empty, error, and retry states are explicit.

### Notifications and history

Transactional email covers invitations and booking confirmation, change, and
cancellation. Delivery is asynchronous, observable, and retryable.

Audit history records actor, source, booking lifecycle changes, policy
overrides, material availability changes, and membership changes.

## Security and privacy

- Organization identifiers from clients are untrusted.
- Authorization is enforced in every protected server operation.
- Public, authentication, invitation, booking, and magic-link endpoints need
  rate limiting and abuse protection.
- Sensitive tokens, credentials, and unnecessary personal data are not logged.
- Retention, deletion, and export behavior must be defined before production.
- Design and operation must account for applicable GDPR obligations.

## First release

Current proposed scope:

- Registration and sign-in
- Owner and admin roles
- One organization per owner initially without blocking future membership in
  multiple organizations
- Fixed-duration services
- Organization- or service-level recurring availability and one-time closures
- Capacity one and immediate confirmation
- Public booking, cancellation, and rescheduling
- Confirmation email and secure management link
- Admin day/week calendar
- Invitation flow, tenant isolation, audit history, and abuse protection

Restaurants, group capacity, party size, staff selection, physical resources,
manual approval, payments, reminders, and integrations are later unless the
first target customer requires them.

## Quality bar

- Mobile-first, keyboard-accessible public booking flow
- Clear and safe validation errors
- Automated time-zone and daylight-saving tests
- Integration tests for authorization and tenant isolation
- A real-database concurrency test for capacity
- Structured telemetry without sensitive data
- The layered test strategy in `ARCHITECTURE.md`

## Decisions still open

1. First target business type
2. Whether “booking” is the final internal term
3. Customizable public terminology
4. Service-only versus staff/resource selection
5. Initial availability scope and capacity model
6. Immediate confirmation versus optional approval
7. Required and custom client fields
8. Management-link expiry
9. Email verification and reminders
10. Admin policy overrides
11. Effect of scheduling changes on existing bookings
12. Providers for auth, database, email, jobs, and hosting

## Core acceptance journey

The first coherent journey is complete when an owner can publish a service and
availability; a client can make, reschedule, and cancel a booking; concurrent
requests cannot overbook; email supplies a secure management link; the owner
sees the result; and another organization's user cannot read or mutate it.
