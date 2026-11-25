import type { IconName } from '@/components/ui/icon';

import type { ExpenseCategory, PaymentMode, SaleType } from './model';

export const SALE_ICONS: Record<SaleType, IconName> = {
  EGG_SALE: 'egg-outline',
  CHICKEN_SALE: 'bird',
  MANURE_SALE: 'sprout-outline',
  OTHER: 'dots-horizontal-circle-outline',
};

export const EXPENSE_ICONS: Record<ExpenseCategory, IconName> = {
  FEED: 'grain',
  LABOUR: 'account-hard-hat-outline',
  MEDICINE: 'pill',
  VACCINATION: 'needle',
  ELECTRICITY: 'flash-outline',
  WATER: 'water-outline',
  TRANSPORTATION: 'truck-outline',
  MAINTENANCE: 'wrench-outline',
  EQUIPMENT: 'tools',
  FARM_RENT: 'home-city-outline',
  PACKAGING: 'package-variant',
  MISCELLANEOUS: 'dots-horizontal-circle-outline',
};

export const PAYMENT_MODE_ICONS: Record<PaymentMode, IconName> = {
  CASH: 'cash',
  UPI: 'cellphone',
  BANK_TRANSFER: 'bank-outline',
  CREDIT: 'clock-outline',
  CHEQUE: 'checkbook',
  CARD: 'credit-card-outline',
};
