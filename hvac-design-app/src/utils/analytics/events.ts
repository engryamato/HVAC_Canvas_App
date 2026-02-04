/**
 * Analytics Event Schema and Types
 *
 * Comprehensive TypeScript event definitions for tracking user interactions,
 * preferences, and feature usage. All events are designed to be privacy-first
 * with no PII (Personally Identifiable Information) included.
 */

// =============================================================================
// Event Categories
// =============================================================================

export enum EventCategory {
  UserPreference = 'user_preference',
  UserAction = 'user_action',
  Feature = 'feature',
  Tutorial = 'tutorial',
  System = 'system',
  Preset = 'preset',
}

// =============================================================================
// Preference Events
// =============================================================================

export enum PreferenceEventName {
  DARK_MODE_ENABLED = 'dark_mode_enabled',
  DARK_MODE_DISABLED = 'dark_mode_disabled',
  GRID_SIZE_CHANGED = 'grid_size_changed',
  UNIT_SYSTEM_CHANGED = 'unit_system_changed',
  SNAP_TO_GRID_TOGGLED = 'snap_to_grid_toggled',
  AUTO_SAVE_TOGGLED = 'auto_save_toggled',
}

export interface PreferenceEventPayload {
  previousValue?: string | number | boolean;
  newValue?: string | number | boolean;
  source?: 'settings' | 'keyboard_shortcut' | 'quick_action';
}

export interface PreferenceEvent {
  category: EventCategory.UserPreference;
  name: PreferenceEventName;
  payload: PreferenceEventPayload;
}

// =============================================================================
// Action Events
// =============================================================================

export enum ActionEventName {
  KEYBOARD_SHORTCUT_USED = 'keyboard_shortcut_used',
  EXPORT_INITIATED = 'export_initiated',
  EXPORT_COMPLETED = 'export_completed',
  EXPORT_FAILED = 'export_failed',
  PRINT_INITIATED = 'print_initiated',
  SAVE_INITIATED = 'save_initiated',
  SAVE_COMPLETED = 'save_completed',
  SAVE_FAILED = 'save_failed',
  UNDO_PERFORMED = 'undo_performed',
  REDO_PERFORMED = 'redo_performed',
  COPY_PERFORMED = 'copy_performed',
  PASTE_PERFORMED = 'paste_performed',
  DELETE_PERFORMED = 'delete_performed',
}

export interface ActionEventPayload {
  shortcut?: string;
  format?: string;
  duration?: number;
  error?: string;
  elementType?: string;
  elementCount?: number;
}

export interface ActionEvent {
  category: EventCategory.UserAction;
  name: ActionEventName;
  payload: ActionEventPayload;
}

// =============================================================================
// Feature Events
// =============================================================================

export enum FeatureEventName {
  INSPECTOR_FLOATING_MODE_ENABLED = 'inspector_floating_mode_enabled',
  INSPECTOR_FLOATING_MODE_DISABLED = 'inspector_floating_mode_disabled',
  INSPECTOR_PANEL_RESIZED = 'inspector_panel_resized',
  SIDEBAR_TOGGLED = 'sidebar_toggled',
  TAB_SWITCHED = 'tab_switched',
  ZOOM_CHANGED = 'zoom_changed',
  PAN_PERFORMED = 'pan_performed',
  TOOL_SELECTED = 'tool_selected',
  ELEMENT_CREATED = 'element_created',
  ELEMENT_MODIFIED = 'element_modified',
  ELEMENT_SELECTED = 'element_selected',
  CANVAS_CLEARED = 'canvas_cleared',
}

export interface FeatureEventPayload {
  panelId?: string;
  tabId?: string;
  sidebarState?: 'open' | 'closed';
  zoomLevel?: number;
  toolId?: string;
  elementType?: string;
  modificationField?: string;
  previousWidth?: number;
  newWidth?: number;
}

export interface FeatureEvent {
  category: EventCategory.Feature;
  name: FeatureEventName;
  payload: FeatureEventPayload;
}

// =============================================================================
// Tutorial Events
// =============================================================================

export enum TutorialEventName {
  TUTORIAL_STARTED = 'tutorial_started',
  TUTORIAL_STEP_VIEWED = 'tutorial_step_viewed',
  TUTORIAL_STEP_COMPLETED = 'tutorial_step_completed',
  TUTORIAL_COMPLETED = 'tutorial_completed',
  TUTORIAL_SKIPPED = 'tutorial_skipped',
  TUTORIAL_DISMISSED = 'tutorial_dismissed',
  TUTORIAL_RESTARTED = 'tutorial_restarted',
}

export interface TutorialEventPayload {
  tutorialId?: string;
  stepIndex?: number;
  stepId?: string;
  totalSteps?: number;
  completionPercentage?: number;
  timeSpentSeconds?: number;
  skipReason?: string;
}

export interface TutorialEvent {
  category: EventCategory.Tutorial;
  name: TutorialEventName;
  payload: TutorialEventPayload;
}

// =============================================================================
// System Events
// =============================================================================

export enum SystemEventName {
  STORAGE_QUOTA_WARNING = 'storage_quota_warning',
  STORAGE_CLEARED = 'storage_cleared',
  CLOUD_BACKUP_INITIATED = 'cloud_backup_initiated',
  CLOUD_BACKUP_COMPLETED = 'cloud_backup_completed',
  CLOUD_BACKUP_FAILED = 'cloud_backup_failed',
  APP_LOADED = 'app_loaded',
  APP_ERROR = 'app_error',
  PERFORMANCE_WARNING = 'performance_warning',
}

export interface SystemEventPayload {
  storageUsedBytes?: number;
  storageQuotaBytes?: number;
  backupSizeBytes?: number;
  loadTimeMs?: number;
  errorCode?: string;
  errorMessage?: string;
  performanceMetric?: string;
  performanceValue?: number;
}

export interface SystemEvent {
  category: EventCategory.System;
  name: SystemEventName;
  payload: SystemEventPayload;
}

// =============================================================================
// Preset Events (Future Implementation)
// =============================================================================

export enum PresetEventName {
  PRESET_CREATED = 'preset_created',
  PRESET_APPLIED = 'preset_applied',
  PRESET_DELETED = 'preset_deleted',
  PRESET_EXPORTED = 'preset_exported',
  PRESET_IMPORTED = 'preset_imported',
  PRESET_RENAMED = 'preset_renamed',
}

export interface PresetEventPayload {
  presetId?: string;
  presetType?: 'equipment' | 'room' | 'duct' | 'custom';
  presetName?: string;
  propertyCount?: number;
}

export interface PresetEvent {
  category: EventCategory.Preset;
  name: PresetEventName;
  payload: PresetEventPayload;
}

// =============================================================================
// Union Types
// =============================================================================

export type AnalyticsEventName =
  | PreferenceEventName
  | ActionEventName
  | FeatureEventName
  | TutorialEventName
  | SystemEventName
  | PresetEventName;

export type AnalyticsEventPayload =
  | PreferenceEventPayload
  | ActionEventPayload
  | FeatureEventPayload
  | TutorialEventPayload
  | SystemEventPayload
  | PresetEventPayload;

export type AnalyticsEvent =
  | PreferenceEvent
  | ActionEvent
  | FeatureEvent
  | TutorialEvent
  | SystemEvent
  | PresetEvent;

// =============================================================================
// Context Interface
// =============================================================================

export interface AnalyticsContext {
  sessionId: string;
  timestamp: string;
  platform: 'web' | 'tauri' | 'unknown';
  appVersion?: string;
  screenSize?: {
    width: number;
    height: number;
  };
}

// =============================================================================
// Full Event Interface (with context)
// =============================================================================

export interface FullAnalyticsEvent {
  event: AnalyticsEvent;
  context: AnalyticsContext;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isPreferenceEvent(event: AnalyticsEvent): event is PreferenceEvent {
  return event.category === EventCategory.UserPreference;
}

export function isActionEvent(event: AnalyticsEvent): event is ActionEvent {
  return event.category === EventCategory.UserAction;
}

export function isFeatureEvent(event: AnalyticsEvent): event is FeatureEvent {
  return event.category === EventCategory.Feature;
}

export function isTutorialEvent(event: AnalyticsEvent): event is TutorialEvent {
  return event.category === EventCategory.Tutorial;
}

export function isSystemEvent(event: AnalyticsEvent): event is SystemEvent {
  return event.category === EventCategory.System;
}

export function isPresetEvent(event: AnalyticsEvent): event is PresetEvent {
  return event.category === EventCategory.Preset;
}
