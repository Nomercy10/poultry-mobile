// Mirrors backend/src/common/types/permissions.ts and auth.service.ts in the web repo.

export type PermissionModule =
  | 'DASHBOARD'
  | 'CHICKEN'
  | 'EGG'
  | 'FEED'
  | 'EXPENSE'
  | 'REVENUE'
  | 'INVENTORY'
  | 'EMPLOYEE'
  | 'REPORT'
  | 'SETTINGS'
  | 'USER'
  | 'CUSTOMER'
  | 'SUPPLIER';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'PRINT';

/** `MODULE:ACTION`, e.g. `EGG:CREATE`. */
export type PermissionKey = `${PermissionModule}:${PermissionAction}`;

/** GET /auth/me */
export type Me = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  permissions: string[];
  employee: { assignedModules: string } | null;
};

export type TokenPair = { accessToken: string; refreshToken: string };

/**
 * What every login method returns: email + password today, phone + OTP later.
 * The session store only ever deals with this shape.
 */
export type AuthSession = TokenPair & {
  user: Pick<Me, 'id' | 'name' | 'email' | 'role' | 'permissions'>;
};

export type LoginMethod = 'password' | 'phone-otp';
