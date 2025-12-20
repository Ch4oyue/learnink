import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type RequestStatus = 'pending' | 'reviewing' | 'completed' | 'rejected';

export interface MaterialRequest {
  id: string;
  user_id: string | null;
  topic: string;
  description: string | null;
  status: RequestStatus | null;
  assigned_to: string | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  category: string | null;
  priority: string | null;
  ai_summary: string | null;
}

export interface MaterialRequestWithUser extends MaterialRequest {
  user_display_name?: string | null;
}

export function useMyRequests(userId?: string) {
  return useQuery({
    queryKey: ['my-requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('material_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MaterialRequest[];
    },
    enabled: !!userId,
  });
}

export function useAllRequests(statusFilter?: RequestStatus) {
  return useQuery({
    queryKey: ['all-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('material_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch user profiles separately
      const requests = data as MaterialRequest[];
      const userIds = [...new Set(requests.map(r => r.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);
        
        return requests.map(r => ({
          ...r,
          user_display_name: r.user_id ? profileMap.get(r.user_id) : null,
        })) as MaterialRequestWithUser[];
      }
      
      return requests as MaterialRequestWithUser[];
    },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      topic, 
      description,
      category,
      priority
    }: { 
      userId: string; 
      topic: string; 
      description?: string;
      category?: string;
      priority?: string;
    }) => {
      const { data, error } = await supabase
        .from('material_requests')
        .insert({
          user_id: userId,
          topic,
          description,
          category,
          priority,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-requests', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast({
        title: "Request terkirim",
        description: "Request materi Anda telah dikirim untuk ditinjau",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal mengirim request materi",
        variant: "destructive",
      });
      console.error('Error creating request:', error);
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      assignedTo, 
      adminNotes 
    }: { 
      id: string; 
      status?: RequestStatus; 
      assignedTo?: string | null;
      adminNotes?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (assignedTo !== undefined) updates.assigned_to = assignedTo;
      if (adminNotes) updates.admin_notes = adminNotes;

      const { data, error } = await supabase
        .from('material_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast({
        title: "Berhasil",
        description: "Request berhasil diperbarui",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal memperbarui request",
        variant: "destructive",
      });
      console.error('Error updating request:', error);
    },
  });
}
