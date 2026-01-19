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
      // First get all profiles (without email since column may not exist)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user_id -> role
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);

      // Combine the data - email will be fetched separately for super admin check
      return profiles.map(profile => ({
        ...profile,
        email: null, // Email fetched separately if needed
        role: roleMap.get(profile.id) || 'user',
      })) as UserWithRole[];
    },
  });
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
