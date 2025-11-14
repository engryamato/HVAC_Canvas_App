import { z } from 'zod'

// Project details schema
export const ProjectDetailsSchema = z.object({
  name: z.string().min(1, 'Project name required'),
  location: z.string(),
  client: z.string(),
  description: z.string().optional()
})

// Canvas object schema (Fabric.js serialized format)
export const CanvasObjectSchema = z.object({
  type: z.string(),
  version: z.string(),
  objects: z.array(z.any())
})

// Main HVAC project file schema
export const HVACProjectFileSchema = z.object({
  version: z.literal('1.0'),
  projectId: z.string().uuid(),
  projectDetails: ProjectDetailsSchema,
  canvas: CanvasObjectSchema,
  calculations: z.record(z.any()).optional(),
  metadata: z.object({
    created: z.string().datetime(),
    modified: z.string().datetime(),
    author: z.string()
  })
})

// Type exports
export type HVACProjectFile = z.infer<typeof HVACProjectFileSchema>
export type ProjectDetails = z.infer<typeof ProjectDetailsSchema>
export type CanvasObject = z.infer<typeof CanvasObjectSchema>

