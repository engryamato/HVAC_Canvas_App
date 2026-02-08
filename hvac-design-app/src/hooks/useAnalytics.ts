/**
 * useAnalytics Hook
 *
 * A custom React hook for consistent analytics tracking across components.
 * Provides helper methods for each event category with automatic context enrichment.
 */

import { useCallback, useRef } from 'react';
import { trackAnalyticsEvent, trackAnalyticsEventImmediate, flushAnalytics } from '../utils/telemetry';
import {
  EventCategory,
  PreferenceEventName,
  ActionEventName,
  FeatureEventName,
  TutorialEventName,
  SystemEventName,
  PresetEventName,
  type PreferenceEvent,
  type PreferenceEventPayload,
  type ActionEvent,
  type ActionEventPayload,
  type FeatureEvent,
  type FeatureEventPayload,
  type TutorialEvent,
  type TutorialEventPayload,
  type SystemEvent,
  type SystemEventPayload,
  type PresetEvent,
  type PresetEventPayload,
} from '../utils/analytics/events';
import { isDebugMode, MIN_EVENT_INTERVAL_MS } from '../utils/analytics/config';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsHookReturn {
  /** Track preference change events (dark mode, grid size, units, etc.) */
  trackPreference: (
    name: PreferenceEventName,
    payload?: PreferenceEventPayload
  ) => void;

  /** Track user action events (keyboard shortcuts, export, save, etc.) */
  trackAction: (
    name: ActionEventName,
    payload?: ActionEventPayload
  ) => void;

  /** Track feature usage events (inspector, sidebar, tools, etc.) */
  trackFeature: (
    name: FeatureEventName,
    payload?: FeatureEventPayload
  ) => void;

  /** Track tutorial interaction events */
  trackTutorial: (
    name: TutorialEventName,
    payload?: TutorialEventPayload
  ) => void;

  /** Track system events (storage, backup, errors) */
  trackSystem: (
    name: SystemEventName,
    payload?: SystemEventPayload
  ) => void;

  /** Track preset operations (create, apply, delete - future use) */
  trackPreset: (
    name: PresetEventName,
    payload?: PresetEventPayload
  ) => void;

  /** Force flush all pending analytics events */
  flush: () => void;

  /** Track an event immediately without batching */
  trackImmediate: <T extends Parameters<typeof trackAnalyticsEventImmediate>[0]>(
    event: T
  ) => Promise<void>;
}

// =============================================================================
// Debounce Helper
// =============================================================================

interface LastEventInfo {
  name: string;
  timestamp: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useAnalytics - React hook for analytics tracking
 *
 * @example
 * ```tsx
 * const { trackPreference, trackAction } = useAnalytics();
 *
 * // Track dark mode toggle
 * trackPreference(PreferenceEventName.DARK_MODE_ENABLED);
 *
 * // Track keyboard shortcut usage
 * trackAction(ActionEventName.KEYBOARD_SHORTCUT_USED, { shortcut: 'Ctrl+S' });
 * ```
 */
export function useAnalytics(): AnalyticsHookReturn {
  // Track last event to prevent duplicate rapid-fire events
  const lastEventRef = useRef<LastEventInfo | null>(null);

  /**
   * Check if event should be deduplicated
   */
  const shouldDeduplicate = useCallback((eventName: string): boolean => {
    const now = Date.now();
    const lastEvent = lastEventRef.current;

    if (lastEvent && lastEvent.name === eventName) {
      const timeSinceLastEvent = now - lastEvent.timestamp;
      if (timeSinceLastEvent < MIN_EVENT_INTERVAL_MS) {
        if (isDebugMode()) {
          logger.debug('[Analytics] Deduplicating rapid-fire event', eventName);
        }
        return true;
      }
    }

    // Update last event
    lastEventRef.current = { name: eventName, timestamp: now };
    return false;
  }, []);

  /**
   * Track preference events
   */
  const trackPreference = useCallback(
    (name: PreferenceEventName, payload: PreferenceEventPayload = {}) => {
      if (shouldDeduplicate(name)) {
        return;
      }

      const event: PreferenceEvent = {
        category: EventCategory.UserPreference,
        name,
        payload,
      };

      trackAnalyticsEvent(event);
    },
    [shouldDeduplicate]
  );

  /**
   * Track action events
   */
  const trackAction = useCallback(
    (name: ActionEventName, payload: ActionEventPayload = {}) => {
      if (shouldDeduplicate(name)) {
        return;
      }

      const event: ActionEvent = {
        category: EventCategory.UserAction,
        name,
        payload,
      };

      trackAnalyticsEvent(event);
    },
    [shouldDeduplicate]
  );

  /**
   * Track feature events
   */
  const trackFeature = useCallback(
    (name: FeatureEventName, payload: FeatureEventPayload = {}) => {
      if (shouldDeduplicate(name)) {
        return;
      }

      const event: FeatureEvent = {
        category: EventCategory.Feature,
        name,
        payload,
      };

      trackAnalyticsEvent(event);
    },
    [shouldDeduplicate]
  );

  /**
   * Track tutorial events
   */
  const trackTutorial = useCallback(
    (name: TutorialEventName, payload: TutorialEventPayload = {}) => {
      if (shouldDeduplicate(name)) {
        return;
      }

      const event: TutorialEvent = {
        category: EventCategory.Tutorial,
        name,
        payload,
      };

      trackAnalyticsEvent(event);
    },
    [shouldDeduplicate]
  );

  /**
   * Track system events
   */
  const trackSystem = useCallback(
    (name: SystemEventName, payload: SystemEventPayload = {}) => {
      if (shouldDeduplicate(name)) {
        return;
      }

      const event: SystemEvent = {
        category: EventCategory.System,
        name,
        payload,
      };

      trackAnalyticsEvent(event);
    },
    [shouldDeduplicate]
  );

  /**
   * Track preset events (for future implementation)
   */
  const trackPreset = useCallback(
    (name: PresetEventName, payload: PresetEventPayload = {}) => {
      if (shouldDeduplicate(name)) {
        return;
      }

      const event: PresetEvent = {
        category: EventCategory.Preset,
        name,
        payload,
      };

      trackAnalyticsEvent(event);
    },
    [shouldDeduplicate]
  );

  /**
   * Flush all pending events
   */
  const flush = useCallback(() => {
    flushAnalytics();
  }, []);

  /**
   * Track an event immediately (bypasses batching)
   */
  const trackImmediate = useCallback(
    async <T extends Parameters<typeof trackAnalyticsEventImmediate>[0]>(
      event: T
    ): Promise<void> => {
      await trackAnalyticsEventImmediate(event);
    },
    []
  );

  return {
    trackPreference,
    trackAction,
    trackFeature,
    trackTutorial,
    trackSystem,
    trackPreset,
    flush,
    trackImmediate,
  };
}

// =============================================================================
// Convenience Exports
// =============================================================================

// Re-export event names for easy access
export {
  PreferenceEventName,
  ActionEventName,
  FeatureEventName,
  TutorialEventName,
  SystemEventName,
  PresetEventName,
};
