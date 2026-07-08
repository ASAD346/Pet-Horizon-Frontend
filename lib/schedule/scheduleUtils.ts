export function deduplicateSchedules(schedules: any[]): any[] {
  if (!Array.isArray(schedules)) return [];
  const seen = new Set<string>();
  return schedules.filter((item) => {
    if (!item) return false;
    const id = item._id || item.id || '';
    const dateVal = item.date || item.scheduledDate || item.dateTime || '';
    const typeVal = item.activityType || item.category || '';
    const key = id ? String(id) : `${dateVal}_${typeVal}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
