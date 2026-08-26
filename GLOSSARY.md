# Geregeld glossary

Geregeld is scheduling software for organizations that offer bookable services.
This glossary defines the words used in the product and its domain model.

## People and organizations

**User**:
A person with a verified email identity who can sign in to Geregeld. A User has
no access to an Organization without a Membership and belongs to at most one
Organization.
_Avoid_: Account, business user

**Registration**:
The creation of a User after their email address has been verified. Registration
does not create an Organization or grant access to one.
_Avoid_: Account creation, organization registration

**Organization**:
A business or independent professional that manages its own Services,
Booking Hours, Date Exceptions, and Bookings in Geregeld. Its name is the public
business name shown to Clients.
_Avoid_: Account, tenant

**Membership**:
The relationship that gives a User a role and permissions within an
Organization.
_Avoid_: Access, organization user

**Owner**:
A User whose Membership gives them full control of an Organization. An
Organization has one Owner.
_Avoid_: Admin, business owner

**Client**:
A person acting in a public booking flow. A Client does not need to become a
User.
_Avoid_: Customer, User

## Scheduling

**Service**:
A bookable activity offered by an Organization. A Service defines how much
uninterrupted time a Booking needs. Preparation and cleanup time may extend the
time that the Booking occupies without changing the time shown to the Client.
_Avoid_: Product, appointment type

**Booking Hours**:
The recurring weekly windows when an Organization accepts Bookings. Booking
Hours are continuous windows, not Slots, and do not have a Service duration.
They use the Organization's configured time zone and continue until changed.
The Owner-facing English UI labels them "Bookable hours."
_Avoid_: Availability Period, Slot, opening hours

**Date Exception**:
The Booking Hours for one local calendar date. A Date Exception replaces the
regular Booking Hours for that date and may make the entire date closed.
_Avoid_: Manual period, special Slot

**Availability**:
The time that remains bookable after Geregeld combines Booking Hours, a Date
Exception when present, existing Bookings, the selected Service, and available
capacity. Availability is calculated rather than stored as fixed-duration
Slots.
_Avoid_: Booking Hours, Slot

**Start Interval**:
The frequency at which Geregeld considers candidate start times, such as every
15 minutes. A Start Interval is independent of Service duration.
_Avoid_: Service duration, Slot duration

**Slot**:
A candidate start and end time for a specific Service. Geregeld offers a Slot
only when the Service fits inside one uninterrupted span of Availability. A
Slot is not reserved and may become unavailable before the Client completes a
Booking.
_Avoid_: Appointment, Booking

**Capacity**:
The number of compatible Bookings an Organization can accept at the same time.
Capacity may later come from staff, rooms, tables, or other bookable resources.
The first Booking Hours design does not decide the resource model.
_Avoid_: Availability, Booking Hours

**Booking**:
An agreement for an Organization to provide a Service to a Client at a specific
time.
_Avoid_: Appointment, Slot, reservation

**Booking Policy**:
The rules an Organization sets for creating, rescheduling, and canceling
Bookings.
_Avoid_: Configuration, settings
