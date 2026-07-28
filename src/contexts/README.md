# Bounded contexts

Business code is organized by context, then use case:

```text
contexts/<context>/slices/<use-case>/
```

| Context | Owns |
| --- | --- |
| Identity | User identity, authentication, sessions |
| Organizations | Tenants, membership, roles, configuration, booking rules |
| Scheduling | Services, availability, candidate slots |
| Bookings | Appointment entity and lifecycle |

Promote code to context-level folders only when multiple slices share it.
Cross-context calls use public application contracts.
