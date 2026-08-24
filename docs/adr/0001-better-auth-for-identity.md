# Use Better Auth for identity authentication

Geregeld uses the MIT-licensed Better Auth library behind Identity-owned
application contracts for emailed one-time codes, authentication persistence,
and sessions. This keeps authentication data in Geregeld's PostgreSQL database,
fits TanStack Start without an external identity service, and preserves a free
open-source path; one-time codes are stored hashed and email delivery remains a
separate adapter.
