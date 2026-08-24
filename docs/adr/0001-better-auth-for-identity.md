# Use Better Auth for identity authentication

Geregeld uses the MIT-licensed Better Auth library behind Identity-owned
application contracts for emailed one-time codes, authentication persistence,
and sessions. It keeps authentication data in Geregeld's PostgreSQL database
and avoids an external identity service. Identity maps Better Auth data into
the domain model, one-time codes are stored as hashes, and email delivery
remains a separate concern.
