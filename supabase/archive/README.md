# Archived ad-hoc SQL

These files were previously kept loose in `supabase/` and `scripts/`. They are
**not** part of the migration history and are not applied by `supabase db push`.

They are kept here for reference only. If a change is still needed, port it into
a new timestamped file under `supabase/migrations/` so every environment can be
reproduced from the migration chain alone.

| File | Origin | Status |
| --- | --- | --- |
| `create_missing_tables.sql` | `supabase/create_missing_tables.sql` | Superseded by migrations |
| `fix_rls_performance.sql` | `supabase/fix_rls_performance.sql` | Superseded by `20260125000000_fix_security_warnings.sql` and later |
| `fix_all_rpc_and_roles.sql` | `scripts/fix_all_rpc_and_roles.sql` | Superseded by the `GRANT` statements in the migrations |
