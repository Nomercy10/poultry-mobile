import type { Me, PermissionAction, PermissionModule } from './types';

type PermissionSubject = Pick<Me, 'role' | 'permissions'> | null | undefined;

/**
 * Same rule as the web app and the backend: ADMIN can do everything, everyone
 * else needs the exact `MODULE:ACTION` in their effective permissions.
 * This only hides UI; the server still enforces every request.
 */
export function can(user: PermissionSubject, module: PermissionModule, action: PermissionAction = 'READ'): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.permissions.includes(`${module}:${action}`);
}

export function canAny(user: PermissionSubject, modules: PermissionModule[], action: PermissionAction = 'READ') {
  return modules.some((m) => can(user, m, action));
}

export function isAdmin(user: PermissionSubject) {
  return user?.role === 'ADMIN';
}
