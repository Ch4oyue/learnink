import { UserWithRole } from "@/hooks/useUsers";

// Legacy implementation (for benchmarking comparison)
export function filterUsersLegacy(users: UserWithRole[] | null | undefined, searchQuery: string): UserWithRole[] {
  if (!users) return [];

  // Exact logic from AdminDashboard.tsx
  return users.filter(u =>
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

// Optimized implementation
export function filterUsers(users: UserWithRole[] | null | undefined, searchQuery: string): UserWithRole[] {
  if (!users) return [];
  if (!searchQuery) return users;

  const lowerQuery = searchQuery.toLowerCase();

  return users.filter(u =>
    (u.display_name && u.display_name.toLowerCase().includes(lowerQuery)) ||
    u.id.toLowerCase().includes(lowerQuery)
  );
}
