import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/contexts/AuthContext";

export interface UserWithRole {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: AppRole;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // First get all profiles
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
      
      // Combine the data
      return profiles.map(profile => ({
        ...profile,
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
