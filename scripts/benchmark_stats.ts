// ==========================================
// CONFIGURATION
// ==========================================
const SIMULATION_USERS = 10000; // As requested by user
const DB_MAX_CONNECTIONS = 500; // Realistic PgBouncer/Postgres pool size for a decent server
const BASE_DB_QUERY_TIME = 5;   // ms (fast query)
const NETWORK_LATENCY = 50;     // ms (one way)

// ==========================================
// SIMULATION ENGINE
// ==========================================

class DatabaseSimulator {
  private activeConnections = 0;
  private queueLength = 0;
  private maxConnections: number;

  constructor(maxConnections: number) {
    this.maxConnections = maxConnections;
  }

  // Simulates executing a query
  // Returns: processing time in ms
  async executeQuery(complexityWeight: number): Promise<number> {
    // 1. Connection Pool Queueing
    // If pool is full, wait.
    const startWait = performance.now();
    while (this.activeConnections >= this.maxConnections) {
      this.queueLength++;
      await new Promise(resolve => setTimeout(resolve, 10)); // Check every 10ms
      this.queueLength--;
    }
    const waitTime = performance.now() - startWait;

    // 2. Execution
    this.activeConnections++;

    // Simulate DB degradation under load (CPU/IO contention)
    // When pool is 100% full, queries are 5x slower due to context switching/locks
    const loadRatio = this.activeConnections / this.maxConnections;
    const performanceDegradation = 1 + (loadRatio * 4);

    const processingTime = (BASE_DB_QUERY_TIME * complexityWeight) * performanceDegradation;

    await new Promise(resolve => setTimeout(resolve, processingTime));

    this.activeConnections--;

    return waitTime + processingTime;
  }

  getStats() {
    return {
      active: this.activeConnections,
      queued: this.queueLength
    };
  }
}

// Global DB Instance
const db = new DatabaseSimulator(DB_MAX_CONNECTIONS);

// Helper: Simulate Network Round Trip
async function networkRoundTrip() {
  await new Promise(r => setTimeout(r, NETWORK_LATENCY));
}

// ==========================================
// USER BEHAVIORS
// ==========================================

// Scenario A: Client-Side Aggregation (Old Way)
// Fetches 4 different resources in parallel
async function fetchUserData_OldWay() {
  await networkRoundTrip(); // Request sent

  // 4 Parallel Queries hitting the DB
  // Each query is simple (weight 1)
  const results = await Promise.all([
    db.executeQuery(1),
    db.executeQuery(1),
    db.executeQuery(1),
    db.executeQuery(1)
  ]);

  await networkRoundTrip(); // Response received

  const totalDbTime = results.reduce((a, b) => a + b, 0);
  return Math.max(...results) + (NETWORK_LATENCY * 2); // User perceived latency
}

// Scenario B: RPC / Backend Aggregation (New Way)
// Fetches 1 aggregated resource
async function fetchUserData_RPC() {
  await networkRoundTrip();

  // 1 Complex Query (weight 1.5 - joins are slightly heavier than simple select)
  const dbTime = await db.executeQuery(1.5);

  await networkRoundTrip();
  return dbTime + (NETWORK_LATENCY * 2);
}

// ==========================================
// RUNNER
// ==========================================

async function runStressTest(scenarioName: string, userFn: () => Promise<number>) {
  console.log(`\nStarting Stress Test: ${scenarioName}`);
  console.log(`Simulating ${SIMULATION_USERS} concurrent users...`);

  const start = performance.now();

  // Launch all users "at once" (staggered slightly to be realistic JS event loop)
  const promises = Array.from({ length: SIMULATION_USERS }, () => userFn());

  const latencies = await Promise.all(promises);

  const duration = performance.now() - start;

  // Stats
  const avg = latencies.reduce((a,b) => a+b, 0) / latencies.length;
  const max = Math.max(...latencies);
  const p95 = latencies.sort((a,b) => a-b)[Math.floor(latencies.length * 0.95)];

  console.log(`Results for ${scenarioName}:`);
  console.log(`- Total Wall Time: ${(duration/1000).toFixed(2)}s`);
  console.log(`- Avg User Latency: ${avg.toFixed(0)}ms`);
  console.log(`- p95 User Latency: ${p95.toFixed(0)}ms`);
  console.log(`- Max User Latency: ${max.toFixed(0)}ms`);

  return { avg, p95, max, duration };
}

async function main() {
  console.log("=== DB STRESS SIMULATION ===");
  console.log(`Config: ${SIMULATION_USERS} Users, ${DB_MAX_CONNECTIONS} DB Connections`);

  // Run Old Way
  const statsOld = await runStressTest("Client-Side Aggregation (4 reqs/user)", fetchUserData_OldWay);

  // Cool down
  await new Promise(r => setTimeout(r, 2000));

  // Run New Way
  const statsNew = await runStressTest("RPC Aggregation (1 req/user)", fetchUserData_RPC);

  console.log("\n=== FINAL VERDICT ===");
  console.log(`Throughput Improvement: ${(statsOld.duration / statsNew.duration).toFixed(1)}x faster total completion`);
  console.log(`Latency Improvement:    RPC is ${(statsOld.avg / statsNew.avg).toFixed(1)}x faster per user`);

  if (statsOld.p95 > 2000) {
    console.log(`\nCRITICAL WARNING: Client-Side Aggregation caused massive bottlenecks (p95 > 2s).`);
    console.log(`Reason: ${SIMULATION_USERS} users generated ${SIMULATION_USERS * 4} simultaneous DB queries,`);
    console.log(`overwhelming the connection pool (${DB_MAX_CONNECTIONS} slots).`);
  }
}

main().catch(console.error);
