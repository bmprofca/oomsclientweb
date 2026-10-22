import { CATEGORY_OPTIONS, normalizeNotification } from './notification-utils';

test('normalizes server notification fields without widening data', () => {
  expect(normalizeNotification({
    notification_id: 'ntf-1',
    title: 'Task update',
    body: 'A task changed',
    category: 'task',
    create_date: '2026-10-22T10:00:00.000Z',
    read_at: null,
    secret: 'must not be copied',
  })).toEqual({
    id: 'ntf-1',
    title: 'Task update',
    message: 'A task changed',
    category: 'task',
    createdAt: '2026-10-22T10:00:00.000Z',
    isRead: false,
  });
});

test('exposes only supported notification categories', () => {
  expect(CATEGORY_OPTIONS.map(option => option.value)).toEqual([
    'task', 'compliance', 'billing', 'document', 'message', 'system',
  ]);
});
