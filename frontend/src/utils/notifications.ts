/**
 * Notification Utilities
 * 
 * Reusable notification patterns using Mantine's notification system.
 * Import `notifications` and `modals` from their respective packages
 * to use these patterns throughout the app.
 * 
 * @see https://mantine.dev/x/notifications/
 * @see https://mantine.dev/x/modals/
 */

import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';

type ConfirmOptions = Parameters<typeof modals.openConfirmModal>[0];

/**
 * Show a success notification
 */
export function showSuccess(message: string, title = 'Success') {
  notifications.show({
    title,
    message,
    color: 'green',
  });
}

/**
 * Show an error notification
 */
export function showError(message: string, title = 'Error') {
  notifications.show({
    title,
    message,
    color: 'red',
  });
}

/**
 * Show a warning notification
 */
export function showWarning(message: string, title = 'Warning') {
  notifications.show({
    title,
    message,
    color: 'yellow',
  });
}

/**
 * Show an info notification
 */
export function showInfo(message: string, title = 'Info') {
  notifications.show({
    title,
    message,
    color: 'blue',
  });
}

/**
 * Open a confirmation modal with standard delete styling
 * 
 * Example:
 * ```ts
 * confirmDelete({
 *   title: 'Delete transaction',
 *   message: 'Are you sure you want to delete this transaction? This cannot be undone.',
 *   onConfirm: async () => {
 *     await deleteTransaction(id);
 *     showSuccess('Transaction deleted');
 *   },
 * });
 * ```
 */
export function confirmDelete(options: ConfirmOptions) {
  modals.openConfirmModal({
    ...options,
    labels: options.labels || { confirm: 'Delete', cancel: 'Cancel' },
    confirmProps: { color: 'red', ...options.confirmProps },
  });
}

/**
 * Open a confirmation modal with standard action styling
 * 
 * Example:
 * ```ts
 * confirmAction({
 *   title: 'Clear history',
 *   message: 'Clear all messages? This cannot be undone.',
 *   confirmLabel: 'Clear',
 *   onConfirm: () => {
 *     clearHistory();
 *     showSuccess('History cleared');
 *   },
 * });
 * ```
 */
export function confirmAction(
  options: ConfirmOptions & {
    confirmLabel?: string;
    cancelLabel?: string;
  }
) {
  const { confirmLabel = 'Confirm', cancelLabel = 'Cancel', ...rest } = options;
  modals.openConfirmModal({
    ...rest,
    labels: { confirm: confirmLabel, cancel: cancelLabel },
  });
}

/**
 * Show a loading notification that can be updated later
 * 
 * Example:
 * ```ts
 * const id = showLoading('Processing transaction...');
 * 
 * try {
 *   await processTransaction();
 *   updateNotification(id, { message: 'Transaction processed', color: 'green' });
 * } catch (error) {
 *   updateNotification(id, { message: 'Failed to process', color: 'red' });
 * }
 * ```
 */
export function showLoading(message: string, title = 'Loading') {
  const id = `loading-${Date.now()}`;
  notifications.show({
    id,
    title,
    message,
    loading: true,
    autoClose: false,
    withCloseButton: false,
  });
  return id;
}

/**
 * Update an existing notification
 */
export function updateNotification(
  id: string,
  options: {
    title?: string;
    message: string;
    color?: 'green' | 'red' | 'yellow' | 'blue';
    autoClose?: number | boolean;
  }
) {
  notifications.update({
    id,
    loading: false,
    autoClose: options.autoClose !== false ? 4000 : false,
    withCloseButton: true,
    ...options,
  });
}
