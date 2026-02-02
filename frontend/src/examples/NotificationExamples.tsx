/**
 * Example: Using Notifications in Views
 * 
 * This file demonstrates how to use the notification utilities
 * in your views/components throughout the app.
 */

import { Button, Stack } from '@mantine/core';
import {
  confirmAction,
  confirmDelete,
  showError,
  showInfo,
  showLoading,
  showSuccess,
  showWarning,
  updateNotification,
} from '../utils/notifications';

export function NotificationExamples() {
  // Example 1: Simple success notification
  const handleSaveTransaction = async () => {
    try {
      // await saveTransaction(data);
      showSuccess('Transaction saved successfully');
    } catch (_error) {
      showError('Failed to save transaction');
    }
  };

  // Example 2: Delete confirmation
  const handleDeleteDebt = async () => {
    confirmDelete({
      title: 'Delete debt',
      children: 'Are you sure you want to delete this debt? This action cannot be undone.',
        onConfirm: async () => {
          try {
            // await deleteDebt(debtId);
            showSuccess('Debt deleted successfully');
          } catch (_error) {
            showError('Failed to delete debt');
          }
        },
      });
  };

  // Example 3: Generic action confirmation
  const handleClearBudget = () => {
    confirmAction({
      title: 'Reset budget',
      children: 'This will reset all your budget allocations. Continue?',
      confirmLabel: 'Reset',
      onConfirm: () => {
        // resetBudget();
        showSuccess('Budget reset to defaults');
      },
    });
  };

  // Example 4: Loading notification with updates
  const handleCalculatePayoff = async () => {
    const loadingId = showLoading('Calculating debt payoff plan...');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // const result = await calculatePayoffPlan();

      updateNotification(loadingId, {
        title: 'Calculation complete',
        message: 'Your debt payoff plan is ready',
        color: 'green',
      });
    } catch (_error) {
      updateNotification(loadingId, {
        title: 'Calculation failed',
        message: 'Unable to calculate payoff plan',
        color: 'red',
      });
    }
  };

  // Example 5: Warning notification
  const handleBudgetWarning = () => {
    showWarning('You have spent 80% of your Daily Expenses budget', 'Budget Warning');
  };

  // Example 6: Info notification
  const handleFortnightInfo = () => {
    showInfo('Your new fortnight starts tomorrow', 'Upcoming Fortnight');
  };

  return (
    <Stack gap="md" p="md">
      <Button onClick={handleSaveTransaction}>Save Transaction (Success)</Button>
      <Button onClick={() => handleDeleteDebt()} color="red">
        Delete Debt (Confirm)
      </Button>
      <Button onClick={handleClearBudget} color="yellow">
        Reset Budget (Confirm)
      </Button>
      <Button onClick={handleCalculatePayoff} color="blue">
        Calculate Payoff (Loading)
      </Button>
      <Button onClick={handleBudgetWarning} color="yellow">
        Show Warning
      </Button>
      <Button onClick={handleFortnightInfo} color="cyan">
        Show Info
      </Button>
    </Stack>
  );
}
