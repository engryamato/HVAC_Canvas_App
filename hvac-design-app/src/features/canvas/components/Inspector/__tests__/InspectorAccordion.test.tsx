import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InspectorAccordion } from '../InspectorAccordion';
import { useInspectorPreferencesStore } from '../../../store/inspectorPreferencesStore';

// Mock the store
vi.mock('../../../store/inspectorPreferencesStore');

describe('InspectorAccordion', () => {
  const mockSetSectionExpanded = vi.fn();
  const mockToggleSection = vi.fn();

  const sections = [
    { id: 'section1', title: 'Section 1', defaultExpanded: true, content: <div>Content 1</div> },
    { id: 'section2', title: 'Section 2', defaultExpanded: false, content: <div>Content 2</div> },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useInspectorPreferencesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      preferences: {
        room: { section1: true, section2: false },
        duct: {},
        equipment: {},
      },
      setSectionExpanded: mockSetSectionExpanded,
      toggleSection: mockToggleSection,
    });
  });

  it('renders sections with correct titles', () => {
    render(<InspectorAccordion entityType="room" sections={sections} />);
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });

  it('renders default expanded state from store', () => {
    render(<InspectorAccordion entityType="room" sections={sections} />);
    // Content 1 should be visible (expanded)
    expect(screen.getByText('Content 1')).toBeVisible();
  });

  it('updates store when a section is toggled', async () => {
    render(<InspectorAccordion entityType="room" sections={sections} />);
    
    const trigger2 = screen.getByText('Section 2');
    fireEvent.click(trigger2);

    // Radix Accordion should trigger onValueChange which calls setSectionExpanded
    // We expect section2 to become expanded (true)
    await waitFor(() => {
        expect(mockSetSectionExpanded).toHaveBeenCalledWith('room', 'section2', true);
    });
  });
});
