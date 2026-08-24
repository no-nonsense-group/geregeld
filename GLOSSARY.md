# Geregeld glossary

Geregeld is scheduling software for organizations that offer bookable services.
This glossary defines the words used in the product and its domain model.

## People and organizations

**User**:
A person with a verified email identity who can sign in to Geregeld. A User has
no access to an Organization without a Membership.
_Avoid_: Account, business user

**Registration**:
The creation of a User after their email address has been verified. Registration
does not create an Organization or grant access to one.
_Avoid_: Account creation, organization registration

**Organization**:
A business or independent professional that manages its own Services,
Availability, and Bookings in Geregeld.
_Avoid_: Account, tenant

**Membership**:
The relationship that gives a User a role and permissions within an
Organization.
_Avoid_: Access, organization user

**Owner**:
A User whose Membership gives them full control of an Organization.
_Avoid_: Admin, business owner

**Client**:
A person acting in a public booking flow. A Client does not need to become a
User.
_Avoid_: Customer, User

## Scheduling

**Service**:
A bookable activity offered by an Organization.
_Avoid_: Product, appointment type

**Availability**:
The times when an Organization is willing to accept Bookings. Availability
alone does not guarantee that a Slot can be booked.
_Avoid_: Opening hours, schedule

**Slot**:
A candidate time for a Service. A Slot is not reserved and does not guarantee
that a Booking can still be made.
_Avoid_: Appointment, Booking

**Booking**:
An agreement for an Organization to provide a Service to a Client at a specific
time.
_Avoid_: Appointment, Slot, reservation

**Booking Policy**:
The rules an Organization sets for creating, rescheduling, and canceling
Bookings.
_Avoid_: Configuration, settings
