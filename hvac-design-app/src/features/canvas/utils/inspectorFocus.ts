export interface InspectorFocusRequest {
  ids: string[];
  shouldFocus: boolean;
  status: string;
}

export function buildInspectorFocusRequest(ids: string[]): InspectorFocusRequest {
  const uniqueIds = Array.from(new Set(ids.filter((id) => id.trim().length > 0)));

  if (uniqueIds.length === 0) {
    return {
      ids: [],
      shouldFocus: false,
      status: 'No matching canvas elements found.',
    };
  }

  return {
    ids: uniqueIds,
    shouldFocus: true,
    status: `Selected ${uniqueIds.length} canvas element${uniqueIds.length === 1 ? '' : 's'}.`,
  };
}
