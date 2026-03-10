import { ProjectMetadataSchema } from "./src/core/schema/project-file.schema";

const json = `{"schemaVersion":"1.0.0","projectId":"550e8400-e29b-41d4-a716-446655440000","projectName":"Test Project","projectNumber":"PRJ-001","clientName":"Test Client","location":"Test Location","createdAt":"2024-01-01T00:00:00.000Z","modifiedAt":"2024-01-01T00:00:00.000Z","entities":{"byId":{},"allIds":[]},"viewportState":{"panX":0,"panY":0,"zoom":1},"settings":{"unitSystem":"imperial","gridSize":12,"gridVisible":true,"snapToGrid":true,"activeViewMode":"plan"},"scope":{"projectType":"residential","details":[],"materials":[]},"siteConditions":{"elevation":"100","outdoorTemp":"70","indoorTemp":"70","windSpeed":"90","humidity":"50","localCodes":"IBC 2021"},"isArchived":false}`;

const parsed = JSON.parse(json);
const res = ProjectMetadataSchema.safeParse(parsed);
console.log(res.success ? "SUCCESS" : res.error);
