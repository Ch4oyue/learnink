import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export type AppRole = 'user' | 'tutor' | 'admin';

// Profile interface for user profile data
// NOTE: Only includes columns that exist in the Supabase 'profiles' table
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
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

  const fetchEnrolledTracks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_tracks')
        .select('track_id')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching enrollments:', error);
        setEnrolledTrackIds([]);
        return;
      }

      setEnrolledTrackIds(data.map(d => d.track_id));
    } catch (error) {
      logger.error('Error fetching enrollments:', error);
      setEnrolledTrackIds([]);
    }
  };

  // Fetch user profile from profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      logger.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Error fetching user role:', error);
        // Default to 'user' if no role found
        setRole('user');
        return;
      }

      setRole(data?.role as AppRole || 'user');
    } catch (error) {
      logger.error('Error fetching user role:', error);
      setRole('user');
    }
  };

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
          await Promise.all([
            fetchUserRole(session.user.id),
            fetchUserProfile(session.user.id),
            fetchEnrolledTracks(session.user.id)
          ]);
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
              fetchUserRole(session.user.id);
              fetchUserProfile(session.user.id);
              fetchEnrolledTracks(session.user.id);
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
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
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
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Gagal keluar dari akun",
        variant: "destructive",
      });
    }
    setRole(null);
    setProfile(null);
  };

  // Utility to manually refresh profile
  const refreshProfile = async () => {
    if (user) {
      await Promise.all([
        fetchUserProfile(user.id),
        fetchEnrolledTracks(user.id)
      ]);
    }
  };

  const isAdmin = role === 'admin';
  const isTutor = role === 'tutor' || role === 'admin';

  const canAccessTrack = (trackId: string) => {
    if (isAdmin || isTutor) return true;
    return enrolledTrackIds.includes(trackId);
  };

  return (
    <AuthContext.Provider value={{
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
    }}>
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
