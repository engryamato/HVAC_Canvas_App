/**
 * Common types for E2E tests
 */

export interface TestProject {
  id: string;
  name: string;
  projectNumber: string;
  isArchived: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface TestProjectListItem {
  projectId: string;
  projectName: string;
  projectNumber: string;
  isArchived: boolean;
  createdAt: string;
  modifiedAt: string;
}
