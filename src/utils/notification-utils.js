export const CATEGORY_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'billing', label: 'Billing' },
  { value: 'document', label: 'Document' },
  { value: 'message', label: 'Message' },
  { value: 'system', label: 'System' },
];

export function normalizeNotification(row = {}) {
  return {
    id: row.notification_id,
    title: row.title || 'Notification',
    message: row.body || '',
    category: row.category || 'system',
    createdAt: row.create_date,
    isRead: Boolean(row.is_read || row.read_at),
  };
}
