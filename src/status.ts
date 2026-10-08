import type { LocationStatus } from './types';

export const STATUS_COLORS: Record<LocationStatus, string> = {
  active: '#16a34a',
  'not active': '#94a3b8',
};

export const STATUS_LABELS: Record<LocationStatus, string> = {
  active: 'Active',
  'not active': 'Not active',
};
