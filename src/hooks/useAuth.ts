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
            // Only check admin status if user is authenticated and we want to
            // This is optional and won't block loading
            setTimeout(() => {
              checkAdminStatus(session.user.id);
            }, 1000); // Delay admin check to not block initial load
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
            // Delay admin check to not block auth state changes
            setTimeout(() => {
              checkAdminStatus(session.user.id);
            }, 500);
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
      // Check if admin_users table exists by trying a simple query
      const { data, error } = await supabase
        .from('admin_users')
        .select('is_super_admin')
        .eq('user_id', userId)
        .limit(1)
        .single();
      
      if (error) {
        // If table doesn't exist or user is not admin, that's fine
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          // Table doesn't exist or no rows found - not an admin
          setIsAdmin(false);
          return;
        }
        throw error;
      }
      
      setIsAdmin(data?.is_super_admin || false);
    } catch (error) {
      // Silently fail - admin check is optional
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