'use client';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock child components
vi.mock('../FileMenu', () => ({
  FileMenu: () => <div data-testid="file-menu">File</div>,
}));

vi.mock('../EditMenu', () => ({
  EditMenu: () => <div data-testid="edit-menu">Edit</div>,
}));

vi.mock('../ViewMenu', () => ({
  ViewMenu: ({ onResetLayout }: { onResetLayout: () => void }) => (
    <div data-testid="view-menu" onClick={onResetLayout}>View</div>
  ),
}));

vi.mock('../ToolsMenu', () => ({
  ToolsMenu: () => <div data-testid="tools-menu">Tools</div>,
}));

vi.mock('../HelpMenu', () => ({
  HelpMenu: ({ onShowShortcuts }: { onShowShortcuts: () => void }) => (
    <div data-testid="help-menu" onClick={onShowShortcuts}>Help</div>
  ),
}));

vi.mock('@/components/dialogs/KeyboardShortcutsDialog', () => ({
  KeyboardShortcutsDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? <div data-testid="shortcuts-dialog" onClick={() => onOpenChange(false)}>Shortcuts Dialog</div> : null
  ),
}));

vi.mock('@/components/dialogs/SettingsDialog', () => ({
  SettingsDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? <div data-testid="settings-dialog" onClick={() => onOpenChange(false)}>Settings Dialog</div> : null
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Branding', () => {
    it('should render logo', () => {
      render(<Header />);

      expect(screen.getByTestId('app-logo')).toBeDefined();
    });

    it('should display app name "HVAC Pro"', () => {
      render(<Header />);

      expect(screen.getByText('HVAC Pro')).toBeDefined();
    });

    it('should navigate to dashboard when logo clicked', () => {
      render(<Header />);

      const logo = screen.getByTestId('app-logo');
      fireEvent.click(logo);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Menu Bar', () => {
    it('should render menu bar by default', () => {
      render(<Header />);

      expect(screen.getByTestId('file-menu')).toBeDefined();
      expect(screen.getByTestId('edit-menu')).toBeDefined();
      expect(screen.getByTestId('view-menu')).toBeDefined();
      expect(screen.getByTestId('tools-menu')).toBeDefined();
      expect(screen.getByTestId('help-menu')).toBeDefined();
    });

    it('should hide menu bar when showMenuBar is false', () => {
      render(<Header showMenuBar={false} />);

      expect(screen.queryByTestId('file-menu')).toBeNull();
      expect(screen.queryByTestId('edit-menu')).toBeNull();
    });
  });

  describe('Breadcrumb', () => {
    it('should render breadcrumb by default', () => {
      render(<Header />);

      expect(screen.getByTestId('breadcrumb')).toBeDefined();
    });

    it('should display dashboard link in breadcrumb', () => {
      render(<Header />);

      expect(screen.getByTestId('breadcrumb-dashboard')).toBeDefined();
    });

    it('should display project name when provided', () => {
      render(<Header projectName="Test Project" />);

      expect(screen.getByText('Test Project')).toBeDefined();
    });

    it('should not display project name when not provided', () => {
      render(<Header />);

      expect(screen.queryByText('Test Project')).toBeNull();
    });

    it('should hide breadcrumb when showBreadcrumb is false', () => {
      render(<Header showBreadcrumb={false} />);

      expect(screen.queryByTestId('breadcrumb')).toBeNull();
    });
  });

  describe('Settings', () => {
    it('should render settings button', () => {
      render(<Header />);

      expect(screen.getByTestId('settings-button')).toBeDefined();
    });

    it('should open settings dialog when settings button clicked', () => {
      render(<Header />);

      const settingsButton = screen.getByTestId('settings-button');
      fireEvent.click(settingsButton);

      expect(screen.getByTestId('settings-dialog')).toBeDefined();
    });

    it('should close settings dialog when clicked again', () => {
      render(<Header />);

      const settingsButton = screen.getByTestId('settings-button');
      fireEvent.click(settingsButton);

      const dialog = screen.getByTestId('settings-dialog');
      fireEvent.click(dialog);

      expect(screen.queryByTestId('settings-dialog')).toBeNull();
    });

    it('should have aria-label for accessibility', () => {
      render(<Header />);

      const settingsButton = screen.getByTestId('settings-button');
      expect(settingsButton).toHaveAttribute('aria-label', 'Settings');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should open shortcuts dialog on Ctrl+/', () => {
      render(<Header />);

      fireEvent.keyDown(window, { key: '/', ctrlKey: true });

      expect(screen.getByTestId('shortcuts-dialog')).toBeDefined();
    });

    it('should navigate to dashboard on Ctrl+Shift+D', () => {
      render(<Header />);

      fireEvent.keyDown(window, { key: 'd', ctrlKey: true, shiftKey: true });

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should open shortcuts dialog via help menu', () => {
      render(<Header />);

      const helpMenu = screen.getByTestId('help-menu');
      fireEvent.click(helpMenu);

      expect(screen.getByTestId('shortcuts-dialog')).toBeDefined();
    });
  });

  describe('Dialogs', () => {
    it('should render KeyboardShortcutsDialog when triggered', () => {
      render(<Header />);

      fireEvent.keyDown(window, { key: '/', ctrlKey: true });

      expect(screen.getByTestId('shortcuts-dialog')).toBeDefined();
    });

    it('should render SettingsDialog when triggered', () => {
      render(<Header />);

      const settingsButton = screen.getByTestId('settings-button');
      fireEvent.click(settingsButton);

      expect(screen.getByTestId('settings-dialog')).toBeDefined();
    });
  });

  describe('Right Actions', () => {
    it('should render custom right actions when provided', () => {
      render(<Header rightActions={<button data-testid="custom-action">Custom</button>} />);

      expect(screen.getByTestId('custom-action')).toBeDefined();
    });
  });

  describe('Visual Styling', () => {
    it('should have glassmorphism header class', () => {
      render(<Header />);

      const header = screen.getByTestId('header');
      expect(header.className).toContain('glass-header');
    });

    it('should have h-12 height', () => {
      render(<Header />);

      const header = screen.getByTestId('header');
      expect(header.className).toContain('h-12');
    });

    it('should have z-40 for stacking context', () => {
      render(<Header />);

      const header = screen.getByTestId('header');
      expect(header.className).toContain('z-40');
    });
  });
});
