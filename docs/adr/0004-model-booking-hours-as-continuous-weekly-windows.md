# Model booking hours as continuous weekly windows

Geregeld stores an Organization's regular Booking Hours as recurring weekly
windows. A window such as Monday 09:00 to 17:00 remains one continuous window.
It is not split into fixed-duration periods and it continues until the Owner
changes it.

A Date Exception replaces the regular Booking Hours for one local date. It can
define shorter or longer hours, split hours, or a closed date. All Booking Hours
and Date Exceptions use the Organization's configured time zone and remain
within one local calendar date.

Service duration belongs to the Service, not to Booking Hours. When a Client
selects a Service, Geregeld subtracts existing Bookings from the applicable
hours and offers only start times where the Service and its buffers fit inside
one uninterrupted span. The Start Interval controls how often candidate start
times occur and is independent of Service duration.

The Owner interface uses weekday rows with start and end time fields, optional
split hours, and a separate list of Date Exceptions. It does not use a drawing
control, a default availability duration, a materialization date range, or
counts of fixed periods.

Capacity is a separate concern. This decision supports an initial
single-capacity Organization while leaving staff, rooms, tables, and other
bookable resources for a later decision. Booking Hours must not encode Service
duration or resource capacity.

This decision supersedes
[`0003-materialize-weekly-availability-as-dated-periods.md`](./0003-materialize-weekly-availability-as-dated-periods.md).
