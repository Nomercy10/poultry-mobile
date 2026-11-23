import type { Badge } from '@/components/ui/badge';
import type { ComponentProps } from 'react';

import type { BatchStatus, EventType } from './api';
import type { IconName } from '@/components/ui/icon';

type Tone = ComponentProps<typeof Badge>['tone'];

export const STATUS_TONE: Record<BatchStatus, Tone> = {
  HEALTHY: 'success',
  SICK: 'danger',
  DEAD: 'neutral',
  SOLD: 'primary',
  TRANSFERRED: 'neutral',
};

export const EVENT_ICON: Record<EventType, IconName> = {
  VACCINATION: 'needle',
  MEDICINE: 'pill',
  MORTALITY: 'heart-broken-outline',
  WEIGHT_CHECK: 'scale',
  STATUS_CHANGE: 'swap-horizontal',
  NOTE: 'note-text-outline',
};
