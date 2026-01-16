import { logger } from './logger';

export interface TelemetryEventPayload {
  projectId?: string;
  projectSizeBytes?: number;
  source?: string;
  platform?: string;
  error?: string;
  stack?: string;
  details?: Record<string, unknown>;
}

export interface TelemetryEvent {
  name: string;
  timestamp: string;
  payload: TelemetryEventPayload;
}

export async function trackTelemetry(name: string, payload: TelemetryEventPayload = {}): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;

  if (!endpoint) {
    logger.debug('[Telemetry] Skipping telemetry; endpoint not configured.', name, payload);
    return;
  }

  const event: TelemetryEvent = {
    name,
    timestamp: new Date().toISOString(),
    payload: {
      platform: payload.platform ?? (typeof navigator !== 'undefined' ? navigator.userAgent : 'server'),
      ...payload,
    },
  };

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    logger.warn('[Telemetry] Failed to send telemetry', error);
  }
}
