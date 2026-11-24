// Creates the two plan demo accounts (Free and Pro) through the backend's own
// API, so the web repo needs no changes. Their passwords are random, generated
// once and kept in .demo-logins.txt (git-ignored) next to this file.
//
// Plans are not stored by the backend yet: the mobile app maps these emails to
// a plan in src/features/plans/resolve.ts until milestone M5.

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const DEMO_ACCOUNTS = [
  { email: 'free@demo.test', name: 'Free Plan Demo', plan: 'Free' },
  { email: 'pro@demo.test', name: 'Pro Plan Demo', plan: 'Pro' },
];

// The web repo's seed creates this admin in the local demo database only.
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'admin@poultryfarm.com';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? 'Admin@123';
// Farm owners: everything except deleting users and settings (seeded MANAGER role).
const OWNER_ROLE = 'MANAGER';

function newPassword() {
  // Meets the backend rule: 8+ chars, an uppercase letter and a number.
  return `Demo-${randomBytes(6).toString('base64url')}A7`;
}

function readLogins(file) {
  if (!existsSync(file)) return {};
  const logins = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^(\S+@\S+)\s+password:\s+(\S+)/);
    if (match) logins[match[1]] = match[2];
  }
  return logins;
}

function writeLogins(file, logins) {
  const lines = [
    '# Local demo logins (demo database only). Created by npm run backend:demo.',
    '# Plans are applied by the mobile app (src/features/plans/resolve.ts).',
    '',
    ...DEMO_ACCOUNTS.filter((a) => logins[a.email]).map(
      (a) => `${a.email}  password: ${logins[a.email]}  plan: ${a.plan}`,
    ),
    '',
  ];
  writeFileSync(file, lines.join('\n'), { mode: 0o600 });
}

async function call(apiUrl, path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, json };
}

// Seeded by the web repo; same local-only accounts the web README lists.
const SEEDED = [
  { email: 'admin@poultryfarm.com', password: ADMIN_PASSWORD, label: 'Admin (Business)' },
  { email: 'worker@poultryfarm.com', password: process.env.DEMO_WORKER_PASSWORD ?? 'Worker@123', label: 'Worker (Simple mode)' },
];

/** Writes EXPO_PUBLIC_DEMO_LOGINS into .env.local, keeping any other lines. Dev builds only show it. */
function writeAppEnv(envFile, logins) {
  if (!envFile) return;
  const accounts = [
    ...DEMO_ACCOUNTS.filter((a) => logins[a.email]).map((a) => ({ email: a.email, password: logins[a.email], label: `${a.plan} plan` })),
    ...SEEDED,
  ];
  const line = `EXPO_PUBLIC_DEMO_LOGINS=${Buffer.from(JSON.stringify(accounts)).toString('base64')}`;
  const existing = existsSync(envFile) ? readFileSync(envFile, 'utf8').split('\n') : [];
  const kept = existing.filter((l) => l.trim() && !l.startsWith('EXPO_PUBLIC_DEMO_LOGINS='));
  writeFileSync(envFile, [...kept, '# Local demo logins for the dev-only quick sign-in (written by backend:demo)', line, ''].join('\n'), { mode: 0o600 });
}

export async function waitForBackend(baseUrl, timeoutMs = 90_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** Idempotent: creates missing accounts, keeps existing ones. Returns lines to print. */
export async function ensureDemoUsers({ apiUrl, loginsFile, envFile }) {
  const logins = readLogins(loginsFile);
  const login = await call(apiUrl, '/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = login.json?.data?.accessToken;
  if (!token) return [`Could not sign in as the demo admin (${login.status}); demo plan accounts skipped.`];

  const roles = await call(apiUrl, '/roles', { token });
  const roleId = roles.json?.data?.find((r) => r.name === OWNER_ROLE)?.id;
  if (!roleId) return [`Role ${OWNER_ROLE} not found; demo plan accounts skipped.`];

  const notes = [];
  for (const account of DEMO_ACCOUNTS) {
    const password = logins[account.email] ?? newPassword();
    const created = await call(apiUrl, '/users', {
      method: 'POST',
      token,
      body: { name: account.name, email: account.email, password, roleId },
    });
    if (created.status === 201) {
      logins[account.email] = password;
      notes.push(`Created ${account.plan} demo account ${account.email}.`);
    } else if (created.status === 409) {
      if (!logins[account.email]) {
        notes.push(`${account.email} exists but its password isn't in ${loginsFile}. Run backend:demo:reset to recreate it.`);
      }
    } else {
      notes.push(`Could not create ${account.email} (${created.status}: ${created.json?.message ?? 'unknown error'}).`);
    }
  }
  writeLogins(loginsFile, logins);
  writeAppEnv(envFile, logins);
  return notes;
}
