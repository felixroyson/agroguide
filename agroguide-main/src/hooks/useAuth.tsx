import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  role: 'user' | 'admin';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile safely
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        return null;
      }

      return profileData;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Network or unexpected error:', err.message);
      } else {
        console.error('Network or unexpected error:', err);
      }
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      return { error };
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Sign out failed:', err.message);
        return { error: err };
      } else {
        console.error('Sign out failed:', err);
        return { error: new Error('Unknown error') };
      }
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAdmin: profile?.role === 'admin',
    isAuthenticated: !!user,
  };
}
