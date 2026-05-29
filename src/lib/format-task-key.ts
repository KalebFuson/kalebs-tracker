export function formatTaskKey(slug: string, taskNumber: number): string {
  return `${slug.toUpperCase()}-${taskNumber}`;
}
