# Give each table and room its own calendar

Appointment availability remains on the Organization. Tables and rooms are
individually named Bookable Resources with separate availability, default time
block durations and maximum group sizes. Capacity describes a single group;
four seats do not mean four simultaneous bookings. A future public booking flow
must choose a suitable available table, or the client's selected room, and
reserve the whole resource. Combining tables is outside this model.

A shared calendar plus a capacity counter would be smaller, but could not
represent different room hours or prevent two groups from using the same table.
The existing dated-period model remains in place. Overlap checks and replacement
operations are now scoped to one calendar. Existing Organization periods retain
their meaning and are not copied to newly added resources.

Booking style changes only presentation. Switching styles or pausing an offer
preserves its records and hours. Services belong to the appointment offer, with
owner-defined names and durations. Their duration does not rewrite availability;
service-to-slot matching belongs to the future public booking workflow.
