// Starts the web repo's backend (poultry-farm-management/backend) against a
// local, throwaway Postgres with seeded demo data, so the mobile app can be
// tested without touching the real (Neon) database.
//
//   npm run backend:demo           start (creates + seeds the demo DB on first run)
//   npm run backend:demo -- --reset   wipe the demo DB and re-seed
//
// The web repo is expected at ../claude (next to this repo). Override with
// WEB_REPO=/path/to/poultry-farm-management.
//
// Safety: the web repo's own backend/.env points at the production database.
// This script never edits that file. It overrides DATABASE_URL through the
// environment, and refuses to migrate or seed unless Prisma itself reports
// that it is connected to the local demo database.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileRepo = path.resolve(here, '../..');
const webRepo = path.resolve(process.env.WEB_REPO ?? path.join(mobileRepo, '../claude'));
const backendDir = path.join(webRepo, 'backend');

const PG_PORT = 5433;
const DB_NAME = 'poultry_demo';
const DB_USER = 'poultry';
const DB_PASSWORD = 'poultry-demo-only';
const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${PG_PORT}/${DB_NAME}?schema=public`;
const EXPECTED_DATASOURCE = `"${DB_NAME}", schema "public" at "localhost:${PG_PORT}"`;

const dataDir = path.join(here, '.data');
const seededMarker = path.join(here, '.seeded');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!existsSync(path.join(backendDir, 'prisma', 'schema.prisma'))) {
  fail(`Web backend not found at ${backendDir}. Set WEB_REPO to the poultry-farm-management checkout.`);
}

if (process.argv.includes('--reset')) {
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(seededMarker, { force: true });
  console.log('Demo database wiped.');
}

const childEnv = {
  ...process.env,
  NODE_ENV: 'development',
  DATABASE_URL,
  // 5173 = web app (Vite), 8081 = Expo web preview. Phones send no Origin header.
  CORS_ORIGIN: 'http://localhost:5173,http://localhost:8081',
};

function prisma(args) {
  const result = spawnSync('npx', ['prisma', ...args], { cwd: backendDir, env: childEnv, encoding: 'utf8' });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

const firstRun = !existsSync(dataDir);
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: DB_USER,
  password: DB_PASSWORD,
  port: PG_PORT,
  persistent: true,
  onLog: () => {},
});

if (firstRun) {
  console.log('Creating local demo Postgres (first run)…');
  await pg.initialise();
}
await pg.start();
if (firstRun) await pg.createDatabase(DB_NAME);
console.log(`Demo Postgres running on localhost:${PG_PORT}`);

let shuttingDown = false;
async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  await pg.stop().catch(() => {});
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Read-only check first: which database will Prisma actually talk to?
const status = prisma(['migrate', 'status']);
if (!status.output.includes(EXPECTED_DATASOURCE)) {
  console.error(status.output);
  await pg.stop();
  fail('Prisma is not pointed at the local demo database. Aborting before any migration or seed.');
}

const migrate = prisma(['migrate', 'deploy']);
if (!migrate.ok) {
  console.error(migrate.output);
  await shutdown(1);
}

if (!existsSync(seededMarker)) {
  console.log('Seeding demo data (roles, demo users, 30 days of history)…');
  const seed = spawnSync('npm', ['run', 'prisma:seed'], { cwd: backendDir, env: childEnv, stdio: 'inherit' });
  if (seed.status !== 0) await shutdown(1);
  writeFileSync(seededMarker, new Date().toISOString());
}

console.log('Starting web backend on http://localhost:4000 (demo database)…\n');
const backend = spawn('npm', ['run', 'dev'], { cwd: backendDir, env: childEnv, stdio: 'inherit' });
backend.on('exit', (code) => shutdown(code ?? 0));
