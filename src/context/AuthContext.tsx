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
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser | null) => {
    console.log('fetchUserProfile called with:', supabaseUser);
    if (!supabaseUser) {
      setProfile(null);
      setUser(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('multiple (or no) rows returned')) {
          console.error('Profile not found or duplicate profiles for user:', supabaseUser.id);
          setProfile(null);
          setUser(null);
        } else {
          console.error('Error fetching profile:', error.message);
          setProfile(null);
          setUser({ ...supabaseUser, profile: null });
        }
      } else {
        console.log('[AuthProvider] Profile fetched:', data);
        const profileData = data as Profile;
        setProfile(profileData);
        setUser({ ...supabaseUser, profile: profileData });
      }
    } catch (e) {
      console.error('Exception fetching profile:', e);
      setProfile(null);
      setUser({ ...supabaseUser, profile: null });
    }
  }, [supabase]);

  useEffect(() => {
    const getInitialSession = async () => {
      console.log('getInitialSession running');
      setIsLoading(true);
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('[AuthProvider] Initial session:', currentSession);
        setSession(currentSession);
        const supabaseUser = currentSession?.user ?? null;

        if (supabaseUser) {
          await fetchUserProfile(supabaseUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
        console.log('[AuthProvider] Loading completed');
      }
    };

    getInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setIsLoading(true);
      console.log('[AuthProvider] Auth state changed:', event, currentSession);
      setSession(currentSession);
      const supabaseUser = currentSession?.user ?? null;

      if (supabaseUser) {
        await fetchUserProfile(supabaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [supabase, fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    console.log('[AuthProvider] State:', { session, user, profile, isLoading });
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
