# Database migration guide

The initial PostgreSQL/Supabase migration is in `supabase/migrations/0001_initial.sql`.

Before applying it in production, create the database, configure authentication, review RLS policies, apply it in staging, import verified inventory, test concurrent reservations, and back up before production migration.

This is a schema foundation. It does not seed fake commercial data. Baseline public/customer RLS policies and auth/timestamp triggers are included; merchant/admin policies must be added after the final authorization model is approved.
