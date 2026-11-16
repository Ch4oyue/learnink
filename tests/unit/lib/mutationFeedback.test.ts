import { describe, expect, test, mock } from 'bun:test';
import { mutationFeedback } from '../../../src/lib/mutationFeedback';

describe('mutation feedback behavior', () => {
  test('invalidates each original query key then sends one success toast', () => {
    const events: unknown[] = [];
    const callbacks = mutationFeedback({
      queryClient: { invalidateQueries: ((value: unknown) => { events.push(value); return Promise.resolve(); }) as never },
      toast: ((value: unknown) => { events.push(value); }) as never,
      queryKeys: ['modules', 'my-modules'],
      success: 'Module updated successfully', failure: 'Failed to update module', logMessage: 'Error updating module:',
    });
    callbacks.onSuccess();
    expect(events).toEqual([
      { queryKey: ['modules'] }, { queryKey: ['my-modules'] },
      { title: 'Success', description: 'Module updated successfully' },
    ]);
  });
  test('an error does not invalidate or send success, retains destructive feedback', () => {
    const invalidateQueries = mock(() => Promise.resolve());
    const toast = mock(() => ({}));
    const callbacks = mutationFeedback({ queryClient: { invalidateQueries } as never, toast: toast as never,
      queryKeys: ['my-requests', 'all-requests'], success: 'Request updated successfully',
      failure: 'Failed to update request', logMessage: 'Expected test error:' });
    callbacks.onError(new Error('simulated'));
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
  });
});
