import { can } from '@/features/auth/permissions';
import { enabledLoginMethods } from '@/features/auth/login-methods';

import { defaultUiMode, moreSections, quickAddActions, visibleTabs } from './menu';

// Mirrors the web repo's seed: WORKER gets CREATE/READ/UPDATE on these modules.
const workerModules = ['DASHBOARD', 'EGG', 'CHICKEN', 'FEED', 'EXPENSE'];
const worker = {
  role: 'WORKER',
  permissions: workerModules.flatMap((m) => ['CREATE', 'READ', 'UPDATE'].map((a) => `${m}:${a}`)),
};
const admin = { role: 'ADMIN', permissions: [] };
const eggsOnly = { role: 'Egg collector', permissions: ['EGG:READ', 'EGG:CREATE'] };

describe('can', () => {
  it('lets ADMIN do everything, even with an empty permission list', () => {
    expect(can(admin, 'SETTINGS', 'DELETE')).toBe(true);
  });

  it('needs the exact MODULE:ACTION for everyone else', () => {
    expect(can(worker, 'EGG', 'CREATE')).toBe(true);
    expect(can(worker, 'EGG', 'DELETE')).toBe(false);
    expect(can(worker, 'REVENUE')).toBe(false);
    expect(can(null, 'EGG')).toBe(false);
  });
});

describe('visibleTabs', () => {
  it('shows every tab to an admin', () => {
    expect(visibleTabs(admin)).toEqual({ index: true, flock: true, add: true, stock: true, more: true });
  });

  it('shows the worker their operational tabs', () => {
    expect(visibleTabs(worker)).toEqual({ index: true, flock: true, add: true, stock: true, more: true });
  });

  it('hides Flock from a user without CHICKEN access', () => {
    expect(visibleTabs(eggsOnly)).toMatchObject({ flock: false, stock: true, add: true });
  });

  it('hides ＋ from a read-only user', () => {
    expect(visibleTabs({ role: 'Viewer', permissions: ['DASHBOARD:READ'] })).toMatchObject({ add: false, stock: false });
  });
});

describe('quickAddActions', () => {
  it('offers the worker no money actions except expenses', () => {
    const keys = quickAddActions(worker).map((a) => a.key);
    expect(keys).toContain('eggEntry');
    expect(keys).toContain('expense');
    expect(keys).not.toContain('sale');
  });

  it('offers an egg-only user just egg entry', () => {
    expect(quickAddActions(eggsOnly).map((a) => a.key)).toEqual(['eggEntry']);
  });
});

describe('moreSections', () => {
  it('keeps admin-only items (employees, roles, audit logs) away from the worker', () => {
    const keys = moreSections(worker).flatMap((s) => s.items.map((i) => i.key));
    expect(keys).toEqual(['expenses', 'notifications']);
  });

  it('shows the admin all four sections', () => {
    expect(moreSections(admin).map((s) => s.key)).toEqual(['money', 'insights', 'team', 'admin']);
  });
});

describe('enabledLoginMethods', () => {
  it('offers only email login until phone OTP is switched on', () => {
    expect(enabledLoginMethods({ phoneOtpLogin: false })).toEqual(['password']);
    expect(enabledLoginMethods({ phoneOtpLogin: true })).toEqual(['phone-otp', 'password']);
  });
});

describe('defaultUiMode', () => {
  it('gives workers Simple mode and owners the detailed app', () => {
    expect(defaultUiMode(worker)).toBe('simple');
    expect(defaultUiMode(eggsOnly)).toBe('simple');
    expect(defaultUiMode(admin)).toBe('standard');
    expect(defaultUiMode({ role: 'MANAGER', permissions: [] })).toBe('standard');
    expect(defaultUiMode({ role: 'Accountant', permissions: ['REVENUE:READ'] })).toBe('standard');
    expect(defaultUiMode(null)).toBe('standard');
  });
});
