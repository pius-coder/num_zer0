import type { SmsActivationStatus } from '#/type/sms_activation'

export function isActiveStatus(status: SmsActivationStatus): boolean {
  return status === 'awaiting_number' || status === 'awaiting_sms' || status === 'sms_received'
}

export function getDefaultMarginXaf(costUsd: number): number {
  if (costUsd <= 0.5) return 1000
  if (costUsd <= 1.0) return 1500
  return 2000
}
