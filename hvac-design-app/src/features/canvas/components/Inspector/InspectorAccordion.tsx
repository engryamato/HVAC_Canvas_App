import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useInspectorPreferencesStore } from '../../store/inspectorPreferencesStore';

interface InspectorSection {
  id: string;
  title: string;
  defaultExpanded: boolean;
  content: React.ReactNode;
}

interface InspectorAccordionProps {
  entityType: 'room' | 'duct' | 'equipment';
  sections: InspectorSection[];
}

export function InspectorAccordion({ entityType, sections }: InspectorAccordionProps) {
  const { preferences, setSectionExpanded } = useInspectorPreferencesStore();
  
  const entityPrefs = preferences[entityType];
  
  const value = sections
    .filter((section) => {
       const pref = entityPrefs[section.id as keyof typeof entityPrefs];
       return pref !== undefined ? pref : section.defaultExpanded;
    })
    .map((section) => section.id);

  const handleValueChange = (newValue: string[]) => {
    sections.forEach((section) => {
      const isExpanded = newValue.includes(section.id);
      const currentPref = entityPrefs[section.id as keyof typeof entityPrefs];
      
      if (currentPref !== isExpanded) {
         setSectionExpanded(entityType, section.id, isExpanded);
      }
    });
  };

  return (
    <Accordion
      type="multiple"
      value={value}
      onValueChange={handleValueChange}
      className="w-full bg-white rounded-lg border border-slate-200 shadow-sm"
    >
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id} className="border-b border-slate-200 last:border-b-0">
          <AccordionTrigger 
            className="flex flex-1 items-center justify-between py-3 px-4 font-medium text-sm text-slate-900 hover:bg-slate-100 hover:no-underline rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
                setSectionExpanded(entityType, section.id, !value.includes(section.id));
              }
            }}
          >
            {section.title}
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden text-sm px-4 pb-4">
            <div className="pt-2 space-y-3">
              {section.content}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
