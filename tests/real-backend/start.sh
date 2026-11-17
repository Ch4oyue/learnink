#!/usr/bin/env bash
# Starts the real local backend used by app.real.ts. Local only: dummy JWT secret, no cloud, no real keys.
# Needs on PATH: python3, postgrest, deno, node, npm (installs pgserver and pg into $REAL_WORK).
# Usage: tests/real-backend/start.sh   (prints REAL_ANON_KEY=... when ready)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."
WORK="${REAL_WORK:-/tmp/real-backend}"; mkdir -p "$WORK"
export PGHOST="$WORK/pgdata" PGUSER=postgres
SECRET="super-secret-jwt-token-with-at-least-32-characters-long"

python3 -m venv "$WORK/venv" >/dev/null && "$WORK/venv/bin/pip" install -q pgserver
"$WORK/venv/bin/python" - <<PY
import pgserver; pgserver.get_server("$WORK/pgdata", cleanup_mode=None)
PY
psql -d postgres -qc "drop database if exists lk" -c "create database lk"
psql -d lk -q -f "$HERE/shim.sql"
# Early files reference tables created by later ones (initial schema came from the dashboard), so apply twice.
for pass in 1 2; do for f in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do psql -d lk -q -f "$f" >/dev/null 2>&1 || true; done; done
psql -d lk -q -c "grant usage on schema public to anon,authenticated,service_role; grant all on all tables in schema public to anon,authenticated,service_role; grant all on all functions in schema public to anon,authenticated,service_role; grant all on all sequences in schema public to anon,authenticated,service_role"
psql -d lk -q -f "$HERE/seed.sql"

cat > "$WORK/pgrst.conf" <<CONF
db-uri = "postgresql://authenticator:pw@localhost:5432/lk?host=$WORK/pgdata"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-port = 3001
CONF
setsid nohup postgrest "$WORK/pgrst.conf" >"$WORK/pgrst.log" 2>&1 </dev/null &

jwt() { node -e 'const c=require("crypto"),b=x=>Buffer.from(JSON.stringify(x)).toString("base64url");const h=b({alg:"HS256",typ:"JWT"}),d=b({role:process.argv[1]});console.log(h+"."+d+"."+c.createHmac("sha256",process.argv[2]).update(h+"."+d).digest("base64url"))' "$1" "$SECRET"; }
ANON="$(jwt anon)"; SRK="$(jwt service_role)"
i=0
for f in get-users generate-api-key validate-quiz-answers award-xp; do
  (cd "$ROOT/supabase/functions/$f" && SUPABASE_URL=http://127.0.0.1:9000 SUPABASE_ANON_KEY="$ANON" SUPABASE_SERVICE_ROLE_KEY="$SRK" \
    ALLOWED_ORIGINS=http://127.0.0.1:4177 PORT=$((9101+i)) setsid nohup deno run -A --no-lock --import-map="$HERE/import_map.json" index.ts >"$WORK/fn-$f.log" 2>&1 </dev/null &)
  i=$((i+1))
done
npm i --silent --no-audit --no-fund --prefix "$WORK" pg >/dev/null 2>&1
(cd "$HERE" && PG_MODULE="$WORK/node_modules/pg" setsid nohup node gateway.mjs >"$WORK/gateway.log" 2>&1 </dev/null &)
sleep 8
echo "REAL_ANON_KEY=$ANON"
