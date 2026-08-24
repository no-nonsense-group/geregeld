# Geregeld

Geregeld is scheduling software for organizations that offer bookable services.
Its language separates the people who use the product from the organizations
whose schedules they manage and the clients who make bookings.

## Language

**User**:
A person with a verified email identity who can authenticate to Geregeld. A
User does not necessarily own or have access to an Organization.
_Avoid_: Business user, account

**Registration**:
The creation of a User through verification of their email address.
Registration does not create an Organization or grant organization access.
_Avoid_: Business registration, organization registration, account creation

**Organization**:
A business or independently managed tenant whose scheduling is managed in
Geregeld.
_Avoid_: Account, tenant

**Owner**:
A User who owns and controls an Organization. A User does not become an Owner
until organization setup succeeds.
_Avoid_: Business owner, orphaned owner, admin

**Client**:
A person who makes and manages a Booking without registering with Geregeld.
_Avoid_: User, customer
