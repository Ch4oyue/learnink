/**
 * Realtime channel helpers.
 *
 * supabase.channel() dedupes by topic and returns the existing channel, so a
 * topic name must never repeat while another subscription using it is alive.
 * Two things break that assumption with static names:
 *
 *  1. Concurrent instances: components like NotificationBadge and useUsers
 *     are mounted more than once at the same time (the dashboard layout
 *     renders NotificationBadge twice; AdminDashboardContent mounts useUsers
 *     directly and via useUserStats). The second instance used to alias the
 *     first instance's channel.
 *  2. Remount race: removeChannel() is asynchronous, so a component that
 *     remounts quickly (route change, effect re-run) can re-request its old
 *     topic before the previous channel is gone.
 *
 * Either way the late instance attached postgres_changes callbacks to an
 * already-subscribed channel, which recent @supabase/realtime-js versions
 * reject by throwing:
 *   "cannot add `postgres_changes` callbacks for realtime:<topic> after `subscribe()`"
 * ...crashing the app behind the error boundary.
 *
 * Appending a per-subscription suffix keeps every channel independent.
 */

let channelCounter = 0;

/** Returns a channel topic that is unique across the lifetime of the page. */
export function uniqueChannelTopic(base: string): string {
  channelCounter += 1;
  return `${base}-${channelCounter}`;
}
