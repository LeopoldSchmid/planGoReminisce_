/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { Profile, UserWithProfile } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: UserWithProfile | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const supabase = createSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser | null) => {
    console.log('[AuthProvider] fetchUserProfile: Start. User ID:', supabaseUser ? supabaseUser.id : 'null_user_object');
    if (!supabaseUser) {
      setProfile(null);
      setUser(null);
      console.log('[AuthProvider] fetchUserProfile: No Supabase user provided, cleared profile/user. End.');
      return;
    }
    try {
      console.log(`[AuthProvider] fetchUserProfile: Attempting to fetch profile for user ID: ${supabaseUser.id}`);
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      console.log(`[AuthProvider] fetchUserProfile: Query completed for user ID: ${supabaseUser.id}. Status: ${status}. Error:`, error ? error.message : 'null', 'Data:', data ? 'exists' : 'null');

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('multiple (or no) rows returned')) {
          console.error(`[AuthProvider] fetchUserProfile: Profile not found or duplicate profiles for user ID: ${supabaseUser.id}. Error: ${error.message}`);
          setProfile(null);
          // Keep the Supabase user, but indicate no profile
          setUser({ ...supabaseUser, profile: null });
        } else {
          console.error(`[AuthProvider] fetchUserProfile: Error fetching profile for user ID: ${supabaseUser.id}. Error: ${error.message}`);
          setProfile(null);
          setUser({ ...supabaseUser, profile: null });
        }
      } else if (data) {
        console.log(`[AuthProvider] fetchUserProfile: Profile successfully fetched for user ID: ${supabaseUser.id}.`);
        const profileData = data as Profile;
        setProfile(profileData);
        setUser({ ...supabaseUser, profile: profileData });
      } else {
        // This case should ideally be caught by PGRST116 if .single() expects a row and gets none.
        // However, if data is null and no error, it means no profile found.
        console.warn(`[AuthProvider] fetchUserProfile: No profile data returned for user ID: ${supabaseUser.id}, and no explicit error. Treating as profile not found.`);
        setProfile(null);
        setUser({ ...supabaseUser, profile: null });
      }
    } catch (e: any) {
      console.error(`[AuthProvider] fetchUserProfile: Exception during profile fetch for user ID ${supabaseUser?.id || 'unknown_user_in_catch'}:`, e.message, e.stack);
      setProfile(null);
      // Ensure user state is consistent even on exception
      setUser(supabaseUser ? { ...supabaseUser, profile: null } : null);
    }
    console.log(`[AuthProvider] fetchUserProfile: End for user ID: ${supabaseUser?.id || 'unknown_user_at_end'}. Profile set:`, profile !== null, 'User set:', user !== null);
  }, [supabase]);

  useEffect(() => {
    console.log('[AuthProvider] Setting up onAuthStateChange listener.');
    setIsLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthProvider] onAuthStateChange event: ${event}.`);
      setSession(session);
      const supabaseUser = session?.user ?? null;

      // Set user immediately, but with profile as null initially.
      // The profile will be fetched in the background.
      if (supabaseUser) {
        setUser({ ...supabaseUser, profile: null });
        // Now, fetch the profile and update the state when it's done.
        fetchUserProfile(supabaseUser);
      } else {
        // If there's no user, clear user and profile state.
        setUser(null);
        setProfile(null);
      }

      // As soon as the session is processed, we're no longer in the initial loading state.
      // The profile will populate the UI when its fetch completes.
      setIsLoading(false);
      console.log('[AuthProvider] Auth loading complete. Profile fetching will occur in the background.');
    });

    return () => {
      console.log('[AuthProvider] Unsubscribing from auth state changes.');
      subscription?.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const signOut = async () => {
    console.log('[AuthProvider] signOut: Initiated.');
    try {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        console.log('[AuthProvider] signOut: Completed successfully.');
    } catch (error: any) {
        console.error('[AuthProvider] signOut: Error during sign out:', error.message, error.stack);
    }
  };

  // This useEffect is for debugging and can be removed or commented out later.
  useEffect(() => {
    console.log('[AuthProvider] State changed:', {
      session: session ? 'exists' : 'null',
      user: user ? `exists (ID: ${user.id}, Profile: ${user.profile ? 'yes' : 'no'})` : 'null',
      // profile: profile ? 'exists' : 'null', // Redundant if user.profile is checked
      isLoading
    });
  }, [session, user, profile, isLoading]);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isLoading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
