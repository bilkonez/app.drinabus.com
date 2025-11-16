import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const ADMIN_CACHE_KEY = 'drina_admin_status';
const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async (userId: string): Promise<boolean> => {
      try {
        // Check cache first
        const cached = localStorage.getItem(ADMIN_CACHE_KEY);
        if (cached) {
          const { userId: cachedUserId, isAdmin, timestamp } = JSON.parse(cached);
          if (cachedUserId === userId && Date.now() - timestamp < ADMIN_CACHE_DURATION) {
            return isAdmin;
          }
        }

        // Query database
        const { data, error } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking admin status:', error);
          return false;
        }
        
        const adminStatus = !!data;
        
        // Cache result
        localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
          userId,
          isAdmin: adminStatus,
          timestamp: Date.now()
        }));
        
        return adminStatus;
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    };

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check admin status in background
      if (session?.user) {
        checkAdminStatus(session.user.id).then(setIsAdmin);
      } else {
        setIsAdmin(false);
        localStorage.removeItem(ADMIN_CACHE_KEY);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          checkAdminStatus(session.user.id).then(setIsAdmin);
        } else {
          setIsAdmin(false);
          localStorage.removeItem(ADMIN_CACHE_KEY);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};