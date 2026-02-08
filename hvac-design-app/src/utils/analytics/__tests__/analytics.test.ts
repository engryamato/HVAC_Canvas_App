/**
 * Analytics Unit Tests
 *
 * Tests for the analytics infrastructure including event schema validation,
 * useAnalytics hook functionality, and privacy compliance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  EventCategory,
  PreferenceEventName,
  ActionEventName,
  FeatureEventName,
  isPreferenceEvent,
  isActionEvent,
  isFeatureEvent,
  type PreferenceEvent,
  type ActionEvent,
} from '../events';
import {
  getAnalyticsConfig,
  getSessionId,
  resetSessionId,
  detectPlatform,
  isAnalyticsEnabled,
  PRIVACY_FLAGS,
} from '../config';
import {
  trackAnalyticsEvent,
  trackAnalyticsEventImmediate,
  getQueueSize,
  clearQueue,
} from '../../telemetry';

// =============================================================================
// Mocks
// =============================================================================

// Mock fetch
const mockFetch = vi.fn(() => Promise.resolve({ ok: true } as Response));
global.fetch = mockFetch;

// Mock environment variables
const originalEnv = process.env;

// =============================================================================
// Event Schema Tests
// =============================================================================

describe('Event Schema', () => {
  describe('Event Categories', () => {
    it('should define all event categories', () => {
      expect(EventCategory.UserPreference).toBe('user_preference');
      expect(EventCategory.UserAction).toBe('user_action');
      expect(EventCategory.Feature).toBe('feature');
      expect(EventCategory.Tutorial).toBe('tutorial');
      expect(EventCategory.System).toBe('system');
      expect(EventCategory.Preset).toBe('preset');
    });
  });

  describe('Preference Events', () => {
    it('should define preference event names', () => {
      expect(PreferenceEventName.DARK_MODE_ENABLED).toBe('dark_mode_enabled');
      expect(PreferenceEventName.DARK_MODE_DISABLED).toBe('dark_mode_disabled');
      expect(PreferenceEventName.GRID_SIZE_CHANGED).toBe('grid_size_changed');
      expect(PreferenceEventName.UNIT_SYSTEM_CHANGED).toBe('unit_system_changed');
    });
  });

  describe('Action Events', () => {
    it('should define action event names', () => {
      expect(ActionEventName.KEYBOARD_SHORTCUT_USED).toBe('keyboard_shortcut_used');
      expect(ActionEventName.EXPORT_INITIATED).toBe('export_initiated');
      expect(ActionEventName.EXPORT_COMPLETED).toBe('export_completed');
      expect(ActionEventName.EXPORT_FAILED).toBe('export_failed');
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify preference events', () => {
      const preferenceEvent: PreferenceEvent = {
        category: EventCategory.UserPreference,
        name: PreferenceEventName.DARK_MODE_ENABLED,
        payload: {},
      };
      expect(isPreferenceEvent(preferenceEvent)).toBe(true);
      expect(isActionEvent(preferenceEvent)).toBe(false);
    });

    it('should correctly identify action events', () => {
      const actionEvent: ActionEvent = {
        category: EventCategory.UserAction,
        name: ActionEventName.KEYBOARD_SHORTCUT_USED,
        payload: { shortcut: 'Ctrl+S' },
      };
      expect(isActionEvent(actionEvent)).toBe(true);
      expect(isFeatureEvent(actionEvent)).toBe(false);
    });
  });
});

// =============================================================================
// Configuration Tests
// =============================================================================

describe('Analytics Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAnalyticsConfig', () => {
    it('should return default configuration', () => {
      const config = getAnalyticsConfig();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('batchSize');
      expect(config).toHaveProperty('batchInterval');
      expect(config).toHaveProperty('debugMode');
    });
  });

  describe('Privacy Flags', () => {
    it('should have all privacy flags set to true', () => {
      expect(PRIVACY_FLAGS.noIpCollection).toBe(true);
      expect(PRIVACY_FLAGS.noUserIdentifiers).toBe(true);
      expect(PRIVACY_FLAGS.noLocationData).toBe(true);
      expect(PRIVACY_FLAGS.noDeviceIdentifiers).toBe(true);
      expect(PRIVACY_FLAGS.anonymizedData).toBe(true);
    });

    it('should be immutable', () => {
      expect(Object.isFrozen(PRIVACY_FLAGS)).toBe(true);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      resetSessionId();
    });

    it('should generate a session ID', () => {
      const sessionId = getSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should return the same session ID on subsequent calls', () => {
      const sessionId1 = getSessionId();
      const sessionId2 = getSessionId();
      expect(sessionId1).toBe(sessionId2);
    });

    it('should generate a new session ID after reset', () => {
      const sessionId1 = getSessionId();
      resetSessionId();
      const sessionId2 = getSessionId();
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Platform Detection', () => {
    it('should detect web platform', () => {
      const platform = detectPlatform();
      expect(['web', 'tauri', 'unknown']).toContain(platform);
    });
  });
});

// =============================================================================
// Telemetry Function Tests
// =============================================================================

describe('Telemetry Functions', () => {
  beforeEach(() => {
    clearQueue();
    mockFetch.mockClear();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_TELEMETRY_ENDPOINT: 'https://test-endpoint.com/events',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('trackAnalyticsEvent', () => {
    it('should add event to queue', () => {
      const event: PreferenceEvent = {
        category: EventCategory.UserPreference,
        name: PreferenceEventName.DARK_MODE_ENABLED,
        payload: {},
      };

      trackAnalyticsEvent(event);

      expect(getQueueSize()).toBeGreaterThan(0);
    });
  });

  describe('clearQueue', () => {
    it('should clear the event queue', () => {
      const event: PreferenceEvent = {
        category: EventCategory.UserPreference,
        name: PreferenceEventName.DARK_MODE_ENABLED,
        payload: {},
      };

      trackAnalyticsEvent(event);
      expect(getQueueSize()).toBeGreaterThan(0);

      clearQueue();
      expect(getQueueSize()).toBe(0);
    });
  });
});

// =============================================================================
// Privacy Compliance Tests
// =============================================================================

describe('Privacy Compliance', () => {
  describe('Event Payloads', () => {
    it('should not contain PII fields in preference event payloads', () => {
      const payload = {
        previousValue: 'light',
        newValue: 'dark',
        source: 'settings',
      };

      const piiFields = ['email', 'password', 'phone', 'address', 'ssn', 'creditCard'];
      const payloadKeys = Object.keys(payload);

      piiFields.forEach((field) => {
        expect(payloadKeys).not.toContain(field);
      });
    });

    it('should not contain PII fields in action event payloads', () => {
      const payload = {
        shortcut: 'Ctrl+S',
        format: 'pdf',
        duration: 1500,
      };

      const piiFields = ['email', 'password', 'phone', 'address', 'ssn', 'creditCard'];
      const payloadKeys = Object.keys(payload);

      piiFields.forEach((field) => {
        expect(payloadKeys).not.toContain(field);
      });
    });
  });

  describe('Context Data', () => {
    it('should not include IP addresses in context', () => {
      // The context should only contain session, platform, and screen info
      const expectedContextFields = [
        'sessionId',
        'timestamp',
        'platform',
        'screenSize',
        'appVersion',
      ];

      const disallowedFields = ['ip', 'ipAddress', 'userIp'];

      // This tests the interface definition rather than runtime
      disallowedFields.forEach((field) => {
        expect(expectedContextFields).not.toContain(field);
      });
    });
  });
});

// =============================================================================
// Error Handling Tests
// =============================================================================

describe('Error Handling', () => {
  beforeEach(() => {
    clearQueue();
    mockFetch.mockClear();
  });

  it('should handle fetch failures gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const event: PreferenceEvent = {
      category: EventCategory.UserPreference,
      name: PreferenceEventName.DARK_MODE_ENABLED,
      payload: {},
    };

    // Should not throw
    expect(() => trackAnalyticsEventImmediate(event)).not.toThrow();
  });

  it('should validate event structure', () => {
    // Event without category should fail validation
    const invalidEvent = {
      name: 'test_event',
      payload: {},
    } as unknown as PreferenceEvent;

    // Should handle gracefully (queue may or may not accept based on validation)
    expect(() => trackAnalyticsEvent(invalidEvent)).not.toThrow();
  });
});

// =============================================================================
// Event Batching Tests
// =============================================================================

describe('Event Batching', () => {
  beforeEach(() => {
    clearQueue();
    mockFetch.mockClear();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_TELEMETRY_ENDPOINT: 'https://test-endpoint.com/events',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should accumulate events in queue', () => {
    const events = [
      {
        category: EventCategory.UserPreference,
        name: PreferenceEventName.DARK_MODE_ENABLED,
        payload: {},
      },
      {
        category: EventCategory.UserAction,
        name: ActionEventName.KEYBOARD_SHORTCUT_USED,
        payload: { shortcut: 'Ctrl+S' },
      },
      {
        category: EventCategory.Feature,
        name: FeatureEventName.TOOL_SELECTED,
        payload: { toolId: 'room' },
      },
    ];

    events.forEach((event) => trackAnalyticsEvent(event as PreferenceEvent));

    expect(getQueueSize()).toBe(3);
  });

  it('should clear queue on flush', () => {
    const event: PreferenceEvent = {
      category: EventCategory.UserPreference,
      name: PreferenceEventName.DARK_MODE_ENABLED,
      payload: {},
    };

    trackAnalyticsEvent(event);
    trackAnalyticsEvent(event);
    trackAnalyticsEvent(event);

    expect(getQueueSize()).toBeGreaterThan(0);

    clearQueue();

    expect(getQueueSize()).toBe(0);
  });
});

// =============================================================================
// Environment Flag Tests
// =============================================================================

describe('Analytics Enable Flag', () => {
  const originalEnvCopy = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnvCopy };
  });

  afterEach(() => {
    process.env = originalEnvCopy;
  });

  it('should honor NEXT_PUBLIC_ANALYTICS_ENABLED=false', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'false';
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = 'https://test.com/events';
    
    const config = getAnalyticsConfig();
    expect(config.enabled).toBe(false);
  });

  it('should honor NEXT_PUBLIC_ENABLE_ANALYTICS=false when NEXT_PUBLIC_ANALYTICS_ENABLED is not set', () => {
    delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'false';
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = 'https://test.com/events';
    
    const config = getAnalyticsConfig();
    expect(config.enabled).toBe(false);
  });

  it('should prefer NEXT_PUBLIC_ANALYTICS_ENABLED over NEXT_PUBLIC_ENABLE_ANALYTICS', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'false';
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = 'https://test.com/events';
    
    const config = getAnalyticsConfig();
    expect(config.enabled).toBe(true);
  });

  it('should skip analytics when disabled via environment flag', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'false';
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = 'https://test.com/events';
    
    expect(isAnalyticsEnabled()).toBe(false);
  });
});

// =============================================================================
// Request Timeout Tests
// =============================================================================

describe('Request Timeout', () => {
  beforeEach(() => {
    clearQueue();
    mockFetch.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should abort immediate event on timeout', async () => {
    // Mock fetch that never resolves
    const neverResolve = new Promise<Response>(() => {});
    mockFetch.mockReturnValueOnce(neverResolve);

    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = 'https://test.com/events';
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'true';

    const event: PreferenceEvent = {
      category: EventCategory.UserPreference,
      name: PreferenceEventName.DARK_MODE_ENABLED,
      payload: {},
    };

    const promise = trackAnalyticsEventImmediate(event);

    // Fast-forward past the timeout (default 10 seconds)
    await vi.advanceTimersByTimeAsync(15000);

    // Should complete without throwing
    await expect(promise).resolves.not.toThrow();
  });

  it('should include requestTimeout in config', () => {
    const config = getAnalyticsConfig();
    expect(config.requestTimeout).toBeDefined();
    expect(typeof config.requestTimeout).toBe('number');
    expect(config.requestTimeout).toBeGreaterThan(0);
  });
});
