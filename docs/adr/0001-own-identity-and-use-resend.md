# Own identity persistence and use Resend for registration email

Geregeld owns registration codes, users, and sessions in PostgreSQL behind
Identity application contracts. Registration codes expire after five minutes,
are stored as keyed hashes, and allow three failed attempts. Session cookies
contain an opaque token while PostgreSQL stores its SHA-256 hash.

Resend delivers registration emails in production. Local development keeps the
code in an in-memory inbox so it does not depend on an email service.
