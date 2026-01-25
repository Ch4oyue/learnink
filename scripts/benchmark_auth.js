import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const USER_ID = process.env.TEST_USER_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !USER_ID) {
  console.log('⚠️  Skipping benchmark: Missing environment variables.');
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or PUBLISHABLE_KEY), and TEST_USER_ID');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function runBenchmark() {
  console.log(`Starting benchmark for user: ${USER_ID}`);

  // Warmup
  await supabase.from('profiles').select('id').eq('id', USER_ID).single();

  // 1. Baseline: 3 separate requests
  console.log('Running Baseline (3 requests)...');
  const startBaseline = performance.now();

  await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', USER_ID).single(),
    supabase.from('profiles').select('id, display_name, avatar_url').eq('id', USER_ID).single(),
    supabase.from('user_tracks').select('track_id').eq('user_id', USER_ID)
  ]);

  const endBaseline = performance.now();
  const baselineTime = endBaseline - startBaseline;
  console.log(`Baseline Result: ${baselineTime.toFixed(2)}ms`);

  // 2. Optimized: 1 RPC call
  // We wrap this in try-catch because the function might not exist yet
  console.log('Running Optimized (1 RPC)...');
  try {
    const startOpt = performance.now();

    const { error } = await supabase.rpc('get_user_auth_data', { p_user_id: USER_ID });

    const endOpt = performance.now();

    if (error) throw error;

    const optTime = endOpt - startOpt;
    console.log(`Optimized Result: ${optTime.toFixed(2)}ms`);
    console.log(`Improvement: ${(baselineTime - optTime).toFixed(2)}ms (${((baselineTime - optTime) / baselineTime * 100).toFixed(1)}%)`);

  } catch (err) {
    console.log(`Optimized benchmark failed (function might not exist yet): ${err.message}`);
  }
}

runBenchmark().catch(console.error);
