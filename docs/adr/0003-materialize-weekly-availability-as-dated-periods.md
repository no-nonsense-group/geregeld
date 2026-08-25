# Materialize weekly availability as dated periods (superseded)

This decision is superseded by
[`0004-model-booking-hours-as-continuous-weekly-windows.md`](./0004-model-booking-hours-as-continuous-weekly-windows.md).

The Availability editor can bulk-create Availability Periods from a weekly
pattern for at most one year, but PostgreSQL stores only the resulting dated
periods and no recurrence or series. This keeps persistence and individual-date
editing simple; later bulk changes reapply a pattern and replace the selected
dates instead of editing a recurring series.
