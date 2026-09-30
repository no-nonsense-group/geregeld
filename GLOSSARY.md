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
Availability, and Bookings in Geregeld. Its name is the public business name
shown to Clients.
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
An optional, owner-defined activity offered by an Organization, with a name and
duration. Multiple Services can share the same appointment Availability.
_Avoid_: Product, appointment type

**Availability**:
The time periods on future calendar dates, interpreted only in its configured
time zone, when an Organization or a Bookable Resource is willing to accept Bookings. Availability
alone does not guarantee that a Slot can be booked.
_Avoid_: Opening hours, schedule

**Availability Period**:
A single interval on a specific date when an Organization or one Bookable
Resource is willing to accept one Booking. An Availability Period cannot cross into another calendar date.
_Avoid_: Slot, block

**Default Availability Period Duration**:
An Organization preference used to propose the duration of new Availability
Periods and to split drawn time ranges. Changing it does not alter existing
Availability Periods.
_Avoid_: Appointment duration, Slot duration

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

**Booking Style**:
The way an Organization presents its offer: Appointments, Tables, or Rooms.
Changing Booking Style preserves the Organization's other offers and calendars.
_Avoid_: Industry, business type

**Bookable Resource**:
An individually named table or room with its own Availability and maximum group
size. One Booking occupies the whole Bookable Resource; its capacity is not a
number of simultaneous Bookings.
_Avoid_: Seat, inventory item

**Capacity**:
The maximum number of people in one Booking for a Bookable Resource. Tables are
individual Bookable Resources, even when several have the same Capacity.
_Avoid_: Number of bookings, availability

**Paused Offer**:
A Service or Bookable Resource that the Owner has temporarily made unavailable
for new Bookings. Its details and Availability remain saved.
_Avoid_: Deleted offer
