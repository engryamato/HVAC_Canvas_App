# NewProjectDialog

## Overview

The NewProjectDialog is a comprehensive modal for initializing HVAC projects. It uses a modern accordion-based layout to organize metadata into logical sections (Details, Scope, Site Conditions), ensuring users provide necessary context without being overwhelmed.

## Location

```
src/features/dashboard/components/NewProjectDialog.tsx
```

## Layout

```
┌─────────────────────────────────────────────┐
│  Create New Project                     [X] │
├─────────────────────────────────────────────┤
│ > Project Details (Expanded by default)     │
│   [Name *] [Region]                         │
│   [Client] [Project #]                      │
│                                             │
│ > Project Scope                             │
│   [ ] Ductwork  [ ] Piping                  │
│   [ ] Electrical                            │
│                                             │
│ > Site Conditions                           │
│   [Temp] [Wind] [Orientation]               │
├─────────────────────────────────────────────┤
│                    [Cancel] [Create Project]│
└─────────────────────────────────────────────┘
```

## Dependencies

- `react-hook-form` + `zod` - Form management and validation
- `@/components/ui/dialog` - Shadcn Modal primitive
- `@/components/ui/accordion` - Section organization
- `@/features/dashboard/schemas/projectSchema` - Validation rules

## Component Implementation

```tsx
export function NewProjectDialog({ isOpen, onClose }: Props) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultProjectValues
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      await createProject(data);
      toast.success("Project created");
      onClose();
    } catch (err) {
      toast.error("Failed to create project");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Configure the initial metadata and scope.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="single" collapsible defaultValue="details">
              
              {/* DETAILS SECTION */}
              <AccordionItem value="details">
                <AccordionTrigger>Project Details</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Office Complex A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="client" render={/*...*/} />
                    <FormField name="number" render={/*...*/} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SCOPE ITEMS */}
              <AccordionItem value="scope">
                <AccordionTrigger>Project Scope</AccordionTrigger>
                <AccordionContent>
                   {/* Checkboxes for Duct/Pipe/Elec */}
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

## Styling

Usage of Tailwind + Shadcn UI tokens:
- **Modal**: `sm:max-w-[600px]` for comfortable width.
- **Accordion**: `border-b` dividers with `animate-accordion-down`.
- **Inputs**: Standard ring-offset focus states.
- **Validation**: Destructive text colors automatically handled by `FormMessage`.

## Behavior

1.  **Validation**:
    *   Project Name: Required, min 3 chars.
    *   Client/Number: Optional.
    *   Scope: At least one system type recommended (warning if none).
2.  **Persistence**:
    *   Saves to IndexedDB via `ProjectService`.
    *   Redirects to `/canvas/[id]` on success.

## Testing

```typescript
it('validates required fields', async () => {
  render(<NewProjectDialog isOpen={true} />);
  
  fireEvent.click(screen.getByText('Create Project'));
  
  expect(await screen.findByText('Project name is required')).toBeVisible();
});

it('expands scope section', async () => {
  render(<NewProjectDialog isOpen={true} />);
  
  fireEvent.click(screen.getByText('Project Scope'));
  
  expect(screen.getByLabelText('Ductwork')).toBeVisible();
});
```
