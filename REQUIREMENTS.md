# Geregeld — Product Requirements

Status: Draft  
Version: 0.1  
Last updated: 2026-07-28

## 1. Product summary

Geregeld is a multi-tenant scheduling application for small businesses.
It allows a business to publish its availability and lets clients
self-service a booking without creating an account.

The product should work across different kinds of businesses, including:

- Nail and hair salons
- Restaurants
- Psychologists and other professional services
- Other businesses that accept time-based bookings

Business owners and their invited team members use an authenticated admin
panel. Clients use a public scheduling page and manage a booking through
secure links sent by email.

## 2. Goals

- Make it easy for a business to define and maintain its availability.
- Let clients find and book an available time with minimal friction.
- Let clients reschedule or cancel without creating an account.
- Give businesses control over booking, rescheduling, and cancellation
  policies.
- Give business users a clear view of availability and bookings.
- Keep each organization's data isolated from every other organization.
- Use a SQL-backed architecture whose database provider can be replaced
  without rewriting the product's core domain logic.

## 3. Non-goals for the initial release

- Billing and paid plans
- Charging clients or taking deposits
- Native mobile applications
- Marketplace discovery across multiple businesses
- Integrations with external calendars or point-of-sale systems
- Complex resource optimization
- Full restaurant table and floor-plan management

These may become future requirements and should not be unnecessarily blocked
by early architectural decisions.

## 4. Terminology

The product serves businesses that use different words for the same concept.
The internal domain model needs stable, neutral terminology, while selected
public-facing labels should be configurable per organization.

| Internal term | Meaning | Example public labels |
| --- | --- | --- |
| Organization | A business or independently managed tenant | Salon, practice, restaurant |
| Business user | A registered user with access to an organization | Owner, manager, staff member |
| Client | A person making a booking; no account required | Client, guest, patient, customer |
| Service | Something a client can book | Haircut, consultation, dinner |
| Availability | Rules or exceptions that determine when booking is possible | Opening hours, office hours |
| Slot | A concrete bookable time derived from availability and existing bookings | 10:00–10:30 |
| Booking | A client's claim on a slot | Appointment, reservation, consultation |

“Booking” is the provisional internal term. Organizations should eventually
be able to choose client-facing terminology such as “appointment”,
“reservation”, or another custom label. Internal API, database, and code names
should remain stable when display labels change.

## 5. Actors and access

### 5.1 Organization owner

- Registers for a Geregeld account.
- Creates and initially owns an organization.
- Configures the organization's public scheduling page.
- Configures services, availability, and policies.
- Invites and manages other business users.
- Can view and manage all bookings for the organization.
- Can transfer ownership, subject to later product rules.

### 5.2 Organization member

- Registers or accepts an invitation to access an organization.
- Has permissions determined by an organization role.
- Can view or manage availability and bookings when authorized.

Initial roles are expected to be:

- **Owner:** full control, including membership and organization settings.
- **Admin:** operational control, excluding ownership-only actions.
- **Staff:** limited operational access; exact permissions remain to be
  defined.

### 5.3 Client

- Does not register for an account.
- Opens an organization's public scheduling page.
- Views available slots and relevant service details.
- Submits contact information and books a slot.
- Receives transactional email about the booking.
- Uses a secure, expiring or revocable magic link to view, reschedule, or
  cancel the booking within the organization's policies.

## 6. Core user flows

### 6.1 Owner onboarding

1. A business owner registers and verifies their identity.
2. The owner creates an organization.
3. The owner configures basic details, time zone, and public scheduling
   settings.
4. The owner creates at least one service or bookable offering.
5. The owner configures availability.
6. The owner previews and publishes the public scheduling page.

### 6.2 Configure availability

1. An authorized business user selects an organization and, where applicable,
   a service or staff member.
2. The user creates recurring availability, such as every Monday from
   09:00–17:00.
3. The user adds exceptions, such as holidays, closures, or one-time openings.
4. The system derives bookable slots using availability, duration, buffer,
   capacity, policy, and existing booking data.
5. The admin calendar reflects the resulting availability and conflicts.

### 6.3 Client creates a booking

1. A client opens the organization's public scheduling page.
2. The client selects a service, if the organization offers more than one.
3. The client selects an available date and slot.
4. The client enters the required contact and booking details.
5. The system validates that the slot is still available.
6. The system atomically creates the booking so concurrent clients cannot
   overbook the slot.
7. The client sees a confirmation.
8. The client receives a confirmation email containing a secure management
   link.

### 6.4 Client manages a booking

1. The client opens the secure link from an email.
2. The system shows the booking and the actions currently allowed by policy.
3. The client may cancel or choose another available slot.
4. The system revalidates policy and availability when the action is
   submitted.
5. The system records the change and sends a confirmation email.

### 6.5 Business user manages the schedule

1. An authorized user opens the admin calendar.
2. The user sees availability, unavailable periods, and bookings.
3. The user opens a booking to view its details and history.
4. Subject to permissions, the user can create, reschedule, or cancel a
   booking on the client's behalf.

## 7. Functional requirements

### 7.1 Accounts and authentication

- Only business users have registered accounts.
- A registered user may belong to one or more organizations.
- Every organization-facing request must be authorized against the selected
  organization and the user's membership and role.
- Client booking access must not require an account.
- Client management links must use cryptographically secure tokens.
- Storing raw management tokens in the database should be avoided; store a
  hash or otherwise use a safely verifiable representation.
- Tokens must be revocable, and the effect of expiry on old bookings must be
  defined.

### 7.2 Organizations and membership

- A business user can create an organization.
- An owner can invite users by email.
- An invited user can accept an invitation and join the organization.
- An owner can change roles or remove members, within ownership safeguards.
- Organization data must be isolated at the application and database access
  layers.
- Initial pricing assumptions may allow one free seat and charge for
  additional seats, but billing and enforcement are deferred.

### 7.3 Organization configuration

An organization can configure:

- Name, description, contact details, and branding basics
- Time zone
- Public scheduling page slug or identifier
- Client-facing terminology
- Which client fields are required
- Default booking, rescheduling, and cancellation policies
- Email sender/reply-to behavior, subject to provider capabilities

### 7.4 Services

A service should initially support:

- Name and description
- Duration
- Active or inactive state
- Optional preparation or cleanup buffer
- Optional service-specific availability
- Optional service-specific policy overrides
- Client-facing instructions

Whether staff members, physical resources, group capacity, party size, and
variable duration belong in the initial service model remains open.

### 7.5 Availability

The system must support:

- Recurring weekly availability
- A start date and optional end date for recurring rules
- One-time available periods
- One-time unavailable periods and closures
- Organization time zones
- Safe handling of daylight-saving-time transitions
- Prevention or clear resolution of overlapping rules
- Recalculation of future slots after availability changes

Availability configuration should eventually support these scopes:

- Organization-wide
- Per service
- Per staff member or resource

The scope required for the first release is an open decision.

### 7.6 Slot generation

- Slots are derived from configuration rather than stored as an unlimited set
  of future rows unless implementation evidence favors materialization.
- Slot calculation must consider duration, buffers, availability exceptions,
  existing bookings, capacity, booking horizon, and minimum notice.
- Availability shown publicly is not a guarantee until a booking is committed.
- Booking creation and rescheduling must use a concurrency-safe database
  operation to prevent overbooking.
- Dates must be stored in an unambiguous representation and displayed in the
  organization's time zone.

### 7.7 Bookings

A booking should include:

- Organization
- Service
- Start and end time
- Status
- Client name
- Client email
- Optional phone number
- Organization-defined client fields
- Creation source, such as client or admin
- Relevant policy snapshot or sufficient policy history
- Created and updated timestamps

Expected initial statuses:

- Pending, if manual approval is supported
- Confirmed
- Cancelled
- Completed
- No-show

The initial release must decide whether all client submissions are confirmed
immediately or whether organizations can require approval.

### 7.8 Policies

An organization must be able to configure:

- How far in advance a booking can be made
- Minimum notice before a new booking
- Whether clients can reschedule
- Rescheduling cutoff, such as at least 24 hours before start
- Whether clients can cancel
- Cancellation cutoff, such as at least 24 hours before start

Policy rules must be enforced server-side at the time an action is submitted.
The interface should clearly explain why an action is unavailable.

Authorized business users may need permission to override a policy. Overrides
should be recorded in an audit history.

### 7.9 Admin calendar

- Shows bookings and availability in the organization's time zone.
- Distinguishes available, unavailable, booked, and cancelled states.
- Supports at least day and week views; a useful mobile layout is required.
- Allows filtering by service and, when introduced, staff member or resource.
- Shows booking details appropriate to the user's permissions.
- Allows authorized users to manage bookings.

### 7.10 Public scheduling page

- Is accessible without authentication.
- Displays organization and service information.
- Displays available dates and slots without exposing other clients' data.
- Uses the organization's chosen public terminology.
- Works on mobile and desktop.
- Is keyboard accessible and usable with common assistive technology.
- Does not expose sequential identifiers or sensitive tenant information.

### 7.11 Email

The system sends transactional email for:

- Booking confirmation
- Booking changes
- Booking cancellation
- Client management-link delivery or re-delivery
- Organization invitations

Reminder emails are desirable but their inclusion in the initial release is
an open scope decision.

Email delivery should be asynchronous, observable, and retryable. A temporary
email failure must not incorrectly roll back an otherwise valid booking.

### 7.12 Audit history

The system should record important actions, including:

- Booking creation, rescheduling, cancellation, and status changes
- Whether an action came from a client, business user, or system process
- Policy overrides
- Material availability changes
- Membership and role changes

## 8. Multi-tenancy and data protection

- Every tenant-owned record must be associated directly or transitively with
  exactly one organization.
- Server-side authorization must be the source of truth; filtering in the UI
  is not a security boundary.
- Organization identifiers supplied by a client must never be trusted without
  checking membership and permission.
- Public and magic-link endpoints must return only the minimum required data.
- Sensitive tokens and credentials must not be logged.
- Rate limiting and abuse controls are required for authentication, booking,
  invitation, and email-link endpoints.
- Personal data retention, deletion, and export behavior must be defined before
  production launch.
- The product must be designed with applicable privacy obligations, including
  GDPR, in mind.

## 9. Technical direction

These are current preferences, not final requirements:

- React and TypeScript
- Vite
- Effect for domain logic, effects, validation, and error handling where it
  provides clear value
- TanStack Query for server-state management
- Deployment on Vercel
- A SQL database

The architectural approach, boundaries, and proposed vertical-slice folder
structure are described in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Architecture constraints:

- Keep core domain rules independent from the database vendor and UI.
- Access persistence through explicit repositories or services.
- Use database migrations.
- Do not claim that the database is freely swappable: SQL dialects,
  transactions, constraints, generated identifiers, and operational behavior
  can differ. Prefer portability without weakening data integrity.
- Enforce critical invariants, especially tenant ownership and overbooking
  prevention, as close to the database as practical.
- Keep server-only code and secrets out of the browser bundle.
- Confirm that long-running or scheduled work, email retries, and reminders fit
  the selected Vercel runtime and background-job approach.

## 10. Quality requirements

- The public booking flow must be responsive and mobile-first.
- Admin screens must remain usable on common laptop and mobile sizes.
- All critical flows must have clear loading, empty, error, and retry states.
- Date and time behavior must have automated tests, including daylight-saving
  transitions.
- Tenant-isolation and authorization rules must have integration tests.
- Concurrent booking attempts must have an automated test demonstrating that
  capacity cannot be exceeded.
- Public endpoints must use structured validation and return safe errors.
- The application should produce structured logs and enough telemetry to
  diagnose failed bookings and emails without logging sensitive information.

## 11. Suggested initial release

The smallest coherent first release is:

- Business-user registration and sign-in
- One organization per owner initially, without preventing future
  multi-organization membership
- Owner and admin roles
- One or more fixed-duration services
- Organization- or service-level weekly recurring availability
- One-time closures
- Capacity of one per slot
- Public availability and booking flow
- Immediately confirmed bookings
- Confirmation email with secure management link
- Client cancellation and rescheduling with configurable cutoffs
- Admin day/week calendar and booking details
- Organization invitation flow
- Tenant isolation, audit history, and essential abuse protection

Restaurant party size, group sessions, staff selection, physical resources,
manual approval, payments, reminders, and external calendar synchronization
should be evaluated as later increments unless the first target customer
requires them.

## 12. Open product decisions

These questions should be resolved before fixing the first-release data model
and interaction design:

1. Which business type is the first target customer? Supporting restaurants
   and one-to-one professionals equally from day one introduces different
   capacity and resource requirements.
2. Is “booking” acceptable as the internal term?
3. Which words may an organization customize: only “booking”, or also
   “service”, “client”, and action text?
4. Does a client choose a service, a staff member, both, or neither?
5. Is availability owned by an organization, service, staff member, physical
   resource, or a combination?
6. Does a slot have capacity greater than one? If so, is capacity counted in
   bookings, seats, party size, or resources?
7. Are bookings always confirmed immediately, or can they require business
   approval?
8. What client information is required by default, and may organizations add
   custom questions?
9. How should magic-link expiry work for bookings made far in advance?
10. Should clients verify their email before a slot is finally claimed?
11. Are reminder emails part of the first release?
12. Can admins override cancellation and rescheduling policies?
13. What happens to existing bookings when availability or service duration
    changes?
14. Must the first release support multiple organizations per business user?
15. Which authentication, SQL database, email, background-job, and hosting
    providers will be used?

## 13. Acceptance criteria for the core journey

The first core journey is complete when:

1. An owner can register, create an organization, configure a service and
   recurring availability, and publish a scheduling page.
2. An unauthenticated client can select an available slot, provide required
   details, and receive a confirmed booking.
3. Two concurrent requests cannot exceed the configured slot capacity.
4. The client receives an email with a secure link.
5. The client can use the link to reschedule or cancel when policy permits and
   receives a clear explanation when it does not.
6. The owner can see the booking and resulting availability in the admin
   calendar.
7. A user from another organization cannot read or mutate the booking through
   either normal UI behavior or direct API requests.
