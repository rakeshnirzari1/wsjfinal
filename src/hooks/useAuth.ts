import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Quick check if Supabase is properly configured
  const isSupabaseReady = () => {
    try {
      return supabase && supabase.auth;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // If Supabase is not ready, skip auth entirely
    if (!isSupabaseReady()) {
      console.warn('Supabase not ready, skipping authentication');
      if (mounted) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
      return;
    }

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth session timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            // Don't await admin check to prevent blocking
            checkAdminStatus(session.user.id).catch(() => {
              console.warn('Admin check failed, continuing without admin status');
            });
          }
          setLoading(false);
        }
      } catch (error) {
        console.warn('Error getting initial session, continuing without auth:', error);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await checkAdminStatus(session.user.id);
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout')), 3000)
      );
      
      const adminCheckPromise = supabase
        .from('admin_users')
        .select('is_super_admin')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([adminCheckPromise, timeoutPromise]) as any;
      
      if (!error && data) {
        setIsAdmin(data.is_super_admin || false);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.warn('Admin status check failed, defaulting to false:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
    isAdmin
  };
};