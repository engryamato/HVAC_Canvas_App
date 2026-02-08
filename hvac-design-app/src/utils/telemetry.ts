import { logger } from './logger';
import type {
  AnalyticsEvent,
  AnalyticsContext,
  FullAnalyticsEvent,
} from './analytics/events';
import {
  getAnalyticsConfig,
  isAnalyticsEnabled,
  isDebugMode,
  getSessionId,
  detectPlatform,
} from './analytics/config';

// =============================================================================
// Legacy Types (Backward Compatibility)
// =============================================================================

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

// =============================================================================
// Event Queue for Batching
// =============================================================================

interface QueuedEvent {
  event: FullAnalyticsEvent;
  timestamp: number;
}

let eventQueue: QueuedEvent[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

// =============================================================================
// Legacy Telemetry Function (Backward Compatibility)
// =============================================================================

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
      platform: payload.platform ?? (typeof navigator === 'undefined' ? 'server' : navigator.userAgent),
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

// =============================================================================
// Context Builder
// =============================================================================

function buildAnalyticsContext(): AnalyticsContext {
  const config = getAnalyticsConfig();

  const context: AnalyticsContext = {
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    platform: detectPlatform(),
  };

  if (config.includeScreenSize && typeof globalThis.window !== 'undefined') {
    context.screenSize = {
      width: globalThis.window.innerWidth,
      height: globalThis.window.innerHeight,
    };
  }

  if (config.includeAppVersion) {
    context.appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  }

  return context;
}

// =============================================================================
// Event Validation
// =============================================================================

function validateEvent(event: AnalyticsEvent): boolean {
  if (!event.category || !event.name) {
    logger.warn('[Analytics] Invalid event: missing category or name', event);
    return false;
  }

  // Check for potential PII in payload (basic validation)
  const payload = event.payload;
  if (payload) {
    const piiPatterns = [
      /email/i,
      /password/i,
      /phone/i,
      /address/i,
      /ssn/i,
      /credit.?card/i,
    ];

    const payloadStr = JSON.stringify(payload);
    for (const pattern of piiPatterns) {
      if (pattern.test(payloadStr)) {
        logger.warn('[Analytics] Potential PII detected in event payload', event.name);
        // Don't block the event, just warn
      }
    }
  }

  return true;
}

// =============================================================================
// Batch Sending
// =============================================================================

async function flushEventQueue(): Promise<void> {
  if (isFlushing || eventQueue.length === 0) {
    return;
  }

  const config = getAnalyticsConfig();
  const endpoint = config.endpoint;

  if (!endpoint) {
    if (isDebugMode()) {
      logger.debug('[Analytics] Clearing queue; endpoint not configured');
    }
    eventQueue = [];
    return;
  }

  isFlushing = true;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeout);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'analytics_batch',
        events: eventsToSend.map(q => q.event),
        count: eventsToSend.length,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok && isDebugMode()) {
      logger.warn('[Analytics] Failed to send batch', response.status);
    } else if (isDebugMode()) {
      logger.debug(`[Analytics] Sent batch of ${eventsToSend.length} events`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('[Analytics] Batch request timed out');
    } else {
      logger.warn('[Analytics] Failed to send analytics batch', error);
    }
    // Re-queue events on failure (up to max queue size)
    const maxQueue = config.maxQueueSize;
    const requeued = [...eventsToSend, ...eventQueue].slice(0, maxQueue);
    eventQueue = requeued;
  } finally {
    isFlushing = false;
  }
}

function scheduleBatchFlush(): void {
  const config = getAnalyticsConfig();

  if (batchTimeout) {
    return; // Already scheduled
  }

  batchTimeout = setTimeout(() => {
    batchTimeout = null;
    flushEventQueue();
  }, config.batchInterval);
}

// =============================================================================
// Typed Analytics Event Tracking
// =============================================================================

/**
 * Track a typed analytics event with automatic context enrichment
 */
export function trackAnalyticsEvent<T extends AnalyticsEvent>(event: T): void {
  // Check if analytics is enabled
  if (!isAnalyticsEnabled()) {
    if (isDebugMode()) {
      logger.debug('[Analytics] Analytics disabled, skipping event', event.name);
    }
    return;
  }

  // Validate event
  if (!validateEvent(event)) {
    return;
  }

  // Build context
  const context = buildAnalyticsContext();

  // Create full event
  const fullEvent: FullAnalyticsEvent = {
    event,
    context,
  };

  // Debug logging
  if (isDebugMode()) {
    logger.debug('[Analytics] Tracking event', event.category, event.name, event.payload);
  }

  // Add to queue
  const config = getAnalyticsConfig();
  eventQueue.push({
    event: fullEvent,
    timestamp: Date.now(),
  });

  // Check if we should flush immediately (batch size reached)
  if (eventQueue.length >= config.batchSize) {
    flushEventQueue();
  } else {
    scheduleBatchFlush();
  }
}

/**
 * Track an analytics event immediately (bypasses batching)
 */
export async function trackAnalyticsEventImmediate<T extends AnalyticsEvent>(
  event: T
): Promise<void> {
  const config = getAnalyticsConfig();
  const endpoint = config.endpoint;

  if (!isAnalyticsEnabled() || !endpoint) {
    if (isDebugMode()) {
      logger.debug('[Analytics] Analytics disabled, skipping immediate event', event.name);
    }
    return;
  }

  if (!validateEvent(event)) {
    return;
  }

  const context = buildAnalyticsContext();
  const fullEvent: FullAnalyticsEvent = {
    event,
    context,
  };

  if (isDebugMode()) {
    logger.debug('[Analytics] Tracking immediate event', event.category, event.name);
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeout);

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'analytics_event',
        ...fullEvent,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('[Analytics] Immediate event request timed out');
    } else {
      logger.warn('[Analytics] Failed to send immediate event', error);
    }
  }
}

/**
 * Force flush the event queue (useful before page unload)
 */
export function flushAnalytics(): void {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  flushEventQueue();
}

/**
 * Get the current queue size (for testing/debugging)
 */
export function getQueueSize(): number {
  return eventQueue.length;
}

/**
 * Clear the event queue (for testing)
 */
export function clearQueue(): void {
  eventQueue = [];
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
}

// =============================================================================
// Page Unload Handler
// =============================================================================

if (typeof globalThis.window !== 'undefined') {
  globalThis.window.addEventListener('beforeunload', () => {
    // Attempt to flush remaining events before page unload
    flushAnalytics();
  });
}
