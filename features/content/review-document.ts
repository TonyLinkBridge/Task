export function documentForReview({
  editable,
  synchronized,
  liveDocument,
  snapshotDocument,
}: {
  editable: boolean;
  synchronized: boolean;
  liveDocument: unknown;
  snapshotDocument: unknown | null;
}): unknown | null {
  return editable ? (synchronized ? liveDocument : null) : snapshotDocument;
}
