import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export type AppRole = 'user' | 'tutor' | 'admin' | 'superadmin';

// Profile interface for user profile data
// NOTE: Only includes columns that exist in the Supabase 'profiles' table
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak?: number | null;
  longest_streak?: number | null;
  last_activity_date?: string | null;
  points?: number;
  labels?: string[];
  is_premium?: boolean;
  premium_until?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTutor: boolean;
  refreshProfile: () => Promise<void>;
  enrolledTrackIds: string[];
  canAccessTrack: (trackId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrolledTrackIds, setEnrolledTrackIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Combined fetch using separate queries (RPC not available)
  const fetchAuthData = useCallback(async (userId: string) => {
    try {
      // Role, profile and enrolled tracks are independent lookups: run them in
      // parallel so auth data costs one round trip instead of three sequential ones.
      const [roleResult, fullProfileResult, tracksResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('profiles')
          .select('id, display_name, avatar_url, current_streak, longest_streak, last_activity_date, points, labels, is_premium, premium_until')
          .eq('id', userId)
          .single()
          // These columns are ahead of the generated schema types.
          .overrideTypes<Profile, { merge: false }>(),
        supabase
          .from('user_tracks')
          .select('track_id')
          .eq('user_id', userId),
      ]);

      const roleData = roleResult.data;
      const tracksData = tracksResult.data;

      // Profile columns may lag the deployed schema: fall back to the basic fields.
      let profileData: Profile | null = null;
      if (fullProfileResult.error) {
        logger.warn('Failed to fetch full profile, falling back to basic fields', fullProfileResult.error);
        const { data: basicProfile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', userId)
          .single();
        profileData = basicProfile ?? null;
      } else {
        profileData = fullProfileResult.data;
      }

      // The role comes from `user_roles` only. Inferring it from an email or a
      // hardcoded id would ship identity data to every visitor and could disagree
      // with what RLS actually enforces.
      const userRole = (roleData?.role as AppRole) || 'user';
      setRole(userRole);
      setProfile(profileData);
      setEnrolledTrackIds(tracksData?.map(t => t.track_id) || []);

    } catch (error) {
      logger.error('Error fetching auth data:', error);
      setRole('user');
      setProfile(null);
      setEnrolledTrackIds([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initialize auth by checking existing session first
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          logger.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Optimized: Single RPC call instead of 3 separate requests
          await fetchAuthData(session.user.id);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        logger.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(() => {
            if (mounted) {
              fetchAuthData(session.user.id);
            }
          }, 0);
        } else {
          setRole(null);
          setProfile(null);
          setEnrolledTrackIds([]);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAuthData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });

    // If signup successful and user exists, create profile and default role
    if (!error && data.user) {
      // Create profile with display name
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName || null,
      });

      // Assign default 'user' role
      await supabase.from('user_roles').upsert({
        user_id: data.user.id,
        role: 'user',
      });
    }

    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
    setRole(null);
    setProfile(null);
  }, [toast]);

  // Utility to manually refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      // Optimized: Reuse the single RPC call
      await fetchAuthData(user.id);
    }
  }, [user, fetchAuthData]);

  const isAdmin = role === 'admin' || role === 'superadmin';
  const isTutor = role === 'tutor' || role === 'admin' || role === 'superadmin';

  const canAccessTrack = useCallback((trackId: string) => {
    if (isAdmin || isTutor) return true;
    return enrolledTrackIds.includes(trackId);
  }, [isAdmin, isTutor, enrolledTrackIds]);

  // Memoize the context value: without this, every AuthProvider state change (loading,
  // profile refresh, etc.) creates a new object and re-renders every consumer in the app.
  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    role,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isTutor,
    refreshProfile,
    enrolledTrackIds,
    canAccessTrack
  }), [
    user, session, role, profile, loading,
    signIn, signUp, signOut, isAdmin, isTutor,
    refreshProfile, enrolledTrackIds, canAccessTrack
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
