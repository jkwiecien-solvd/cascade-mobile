/**
 * Public surface of the notifications layer. Import from `@/lib/notifications`
 * rather than reaching into individual modules.
 */
export { NotificationsProvider, useNotifications } from './notifications-provider';
export type { NotificationsState } from './notifications-provider';
export type { NotificationPrefs, NotificationEventPrefs } from './notification-storage';
export { extractRunId } from './notification-deep-link';
