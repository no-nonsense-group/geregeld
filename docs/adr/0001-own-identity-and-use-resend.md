# Own identity persistence and use Resend for verification email

Geregeld owns registration codes, login codes, users, and sessions in PostgreSQL
behind Identity application contracts. Registration and login codes expire
after five minutes, are stored as keyed hashes, and allow three failed attempts.
Session cookies contain an opaque token while PostgreSQL stores its SHA-256
hash.

Resend delivers registration and login emails in production. Local development
keeps codes in in-memory inboxes so it does not depend on an email service.
