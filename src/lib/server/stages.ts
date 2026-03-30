import type { EstimateStatus } from '$lib/types/index.js';

const STATUS_ORDER: EstimateStatus[] = ['draft', 'sent', 'viewed', 'accepted', 'declined'];

const STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
};

export function getStatusLabel(status: EstimateStatus): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusOrder(status: EstimateStatus): number {
  return STATUS_ORDER.indexOf(status);
}
