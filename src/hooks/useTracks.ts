import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Track {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useTracks() {
  return useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Track[];
    },
  });
}

export function useTrack(trackId?: string) {
  return useQuery({
    queryKey: ["track", trackId],
    queryFn: async () => {
      if (!trackId) return null;
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", trackId)
        .single();

      if (error) throw error;
      return data as Track;
    },
    enabled: !!trackId
  });
}

export function useUserTracks(userId?: string) {
  return useQuery({
    queryKey: ["user-tracks", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_tracks")
        .select(`
          id,
          created_at,
          track:tracks (*)
        `)
        .eq("user_id", userId);

      if (error) throw error;

      // Flatten the structure for easier usage
      // We cast to any first because TS might not infer the join structure perfectly
      // without deeper type definitions, but Supabase returns it correctly.
      return (data as any[]).map(item => ({
        ...item.track,
        enrollment_id: item.id,
        enrolled_at: item.created_at
      })) as (Track & { enrollment_id: string; enrolled_at: string })[];
    },
    enabled: !!userId,
  });
}

export function useEnrollTrack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, trackId }: { userId: string; trackId: string }) => {
      const { data, error } = await supabase
        .from("user_tracks")
        .insert({ user_id: userId, track_id: trackId })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation gracefully
        if (error.code === '23505') {
            throw new Error('Anda sudah terdaftar di track ini');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-tracks"] });
      toast({
        title: "Berhasil",
        description: "Anda berhasil mendaftar ke kursus ini",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal Mendaftar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
