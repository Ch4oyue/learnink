import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/contexts/AuthContext";

// Super admin identification - IMPORTANT: Update SUPER_ADMIN_USER_ID after first login
// To find the user ID, run this SQL in Supabase: 
// SELECT id FROM auth.users WHERE email = 'agen.salva@gmail.com';
export const SUPER_ADMIN_EMAIL = 'agen.salva@gmail.com';
export const SUPER_ADMIN_USER_ID: string | null = '676c1aca-b52c-4825-8f7c-1dfef33b107c';

export interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: AppRole;
}

export function useUsers() {
  const queryClient = useQueryClient();

  // Set up realtime subscription for profiles and user_roles
  useEffect(() => {
    const profilesChannel = supabase
      .channel('users-profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('users-roles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Try to fetch profiles with email column first
      let profiles: Array<{
        id: string;
        display_name: string | null;
        avatar_url: string | null;
        created_at: string | null;
        email?: string | null;
      }>;

      const { data: profilesWithEmail, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, created_at, email')
        .order('created_at', { ascending: false });

      if (profilesError) {
        // If error is about email column not existing, try without it
        if (profilesError.code === 'PGRST204' || profilesError.message?.includes('email')) {
          console.warn('Email column not found in profiles, fetching without it');
          const { data: profilesNoEmail, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, created_at')
            .order('created_at', { ascending: false });

          if (fallbackError) throw fallbackError;
          profiles = (profilesNoEmail || []).map(p => ({ ...p, email: null }));
        } else {
          throw profilesError;
        }
      } else {
        profiles = profilesWithEmail || [];
      }

      // Then get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user_id -> role
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);

      // Combine the data with email for Super Admin detection
      return profiles.map(profile => ({
        ...profile,
        email: profile.email || null,
        role: roleMap.get(profile.id) || 'user',
      })) as UserWithRole[];
    },
  });
}

export function isSuperAdmin(user: { id: string; email?: string | null }): boolean {
  // Check by email (primary) or by ID (fallback)
  const emailMatch = user.email === SUPER_ADMIN_EMAIL;
  const idMatch = SUPER_ADMIN_USER_ID !== null && user.id === SUPER_ADMIN_USER_ID;

  return emailMatch || idMatch;
}

export function useUserStats() {
  const { data: users } = useUsers();

  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.role === 'admin').length || 0;
  const tutorCount = users?.filter(u => u.role === 'tutor').length || 0;
  const userCount = users?.filter(u => u.role === 'user').length || 0;

  return {
    totalUsers,
    adminCount,
    tutorCount,
    userCount,
  };
}
