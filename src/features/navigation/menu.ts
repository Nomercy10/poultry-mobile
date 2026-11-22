// What each user can see, derived from the same permissions the server enforces.
// Pure functions so they can be unit-tested per role.

import type { IconName } from '@/components/ui/icon';
import { can, canAny, isAdmin } from '@/features/auth/permissions';
import type { Me, PermissionAction, PermissionModule } from '@/features/auth/types';

type User = Pick<Me, 'role' | 'permissions'> | null;

type Requirement =
  | { module: PermissionModule; action?: PermissionAction }
  | { adminOnly: true }
  | { anyOf: PermissionModule[] }
  | { always: true };

function allowed(user: User, req: Requirement): boolean {
  if ('always' in req) return !!user;
  if ('adminOnly' in req) return isAdmin(user);
  if ('anyOf' in req) return canAny(user, req.anyOf);
  return can(user, req.module, req.action ?? 'READ');
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

export type TabName = 'index' | 'flock' | 'add' | 'stock' | 'more';

export function visibleTabs(user: User): Record<TabName, boolean> {
  return {
    // Home is always there; it shows dashboard cards only with DASHBOARD:READ.
    index: !!user,
    flock: can(user, 'CHICKEN'),
    add: quickAddActions(user).length > 0,
    stock: canAny(user, ['EGG', 'FEED', 'INVENTORY']),
    more: !!user,
  };
}

// ── Quick add (centre ＋) ─────────────────────────────────────────────────────
// Permissions match the backend routes each form will call.

export type QuickAddKey =
  | 'eggEntry'
  | 'mortality'
  | 'feedUsed'
  | 'vaccination'
  | 'medicine'
  | 'weight'
  | 'sale'
  | 'expense'
  | 'feedPurchase'
  | 'newBatch';

type QuickAddAction = { key: QuickAddKey; icon: IconName; requires: Requirement };

const QUICK_ADD: QuickAddAction[] = [
  { key: 'eggEntry', icon: 'egg-outline', requires: { module: 'EGG', action: 'CREATE' } }, // POST /eggs
  { key: 'mortality', icon: 'skull-outline', requires: { module: 'CHICKEN', action: 'UPDATE' } }, // POST /chickens/:id/events
  { key: 'feedUsed', icon: 'grain', requires: { module: 'FEED', action: 'UPDATE' } }, // POST /feed/:id/consumption
  { key: 'vaccination', icon: 'needle', requires: { module: 'CHICKEN', action: 'UPDATE' } }, // PUT /chickens/:id/vaccinations/:vid
  { key: 'medicine', icon: 'pill', requires: { module: 'CHICKEN', action: 'UPDATE' } },
  { key: 'weight', icon: 'scale', requires: { module: 'CHICKEN', action: 'UPDATE' } },
  { key: 'sale', icon: 'cash-plus', requires: { module: 'REVENUE', action: 'CREATE' } }, // POST /revenue
  { key: 'expense', icon: 'cash-minus', requires: { module: 'EXPENSE', action: 'CREATE' } }, // POST /expenses
  { key: 'feedPurchase', icon: 'truck-delivery-outline', requires: { module: 'FEED', action: 'CREATE' } }, // POST /feed
  { key: 'newBatch', icon: 'bird', requires: { module: 'CHICKEN', action: 'CREATE' } }, // POST /chickens
];

export function quickAddActions(user: User) {
  return QUICK_ADD.filter((a) => allowed(user, a.requires));
}

// ── More tab ─────────────────────────────────────────────────────────────────

export type MoreItemKey =
  | 'revenue'
  | 'expenses'
  | 'outstanding'
  | 'customers'
  | 'suppliers'
  | 'reports'
  | 'notifications'
  | 'inventory'
  | 'employees'
  | 'users'
  | 'roles'
  | 'farms'
  | 'appSettings'
  | 'auditLogs';

export type MoreSectionKey = 'money' | 'insights' | 'team' | 'admin';

type MoreItem = { key: MoreItemKey; icon: IconName; requires: Requirement };

const MORE: { key: MoreSectionKey; items: MoreItem[] }[] = [
  {
    key: 'money',
    items: [
      { key: 'revenue', icon: 'trending-up', requires: { module: 'REVENUE' } },
      { key: 'expenses', icon: 'receipt', requires: { module: 'EXPENSE' } },
      { key: 'outstanding', icon: 'cash-clock', requires: { module: 'REVENUE' } },
      { key: 'customers', icon: 'account-cash-outline', requires: { module: 'CUSTOMER' } },
      { key: 'suppliers', icon: 'truck-outline', requires: { module: 'SUPPLIER' } },
    ],
  },
  {
    key: 'insights',
    items: [
      { key: 'reports', icon: 'chart-box-outline', requires: { module: 'REPORT' } },
      { key: 'notifications', icon: 'bell-outline', requires: { always: true } },
      { key: 'inventory', icon: 'warehouse', requires: { module: 'INVENTORY' } },
    ],
  },
  {
    // Employees and roles are ADMIN-only on the server (requireRole), users need USER:READ.
    key: 'team',
    items: [
      { key: 'employees', icon: 'account-hard-hat-outline', requires: { adminOnly: true } },
      { key: 'users', icon: 'account-group-outline', requires: { module: 'USER' } },
      { key: 'roles', icon: 'shield-account-outline', requires: { adminOnly: true } },
    ],
  },
  {
    key: 'admin',
    items: [
      { key: 'farms', icon: 'barn', requires: { module: 'SETTINGS' } },
      { key: 'appSettings', icon: 'cog-outline', requires: { adminOnly: true } },
      { key: 'auditLogs', icon: 'history', requires: { adminOnly: true } },
    ],
  },
];

export function moreSections(user: User) {
  return MORE.map((section) => ({
    key: section.key,
    items: section.items.filter((item) => allowed(user, item.requires)),
  })).filter((section) => section.items.length > 0);
}
