// hooks/use-auth.ts
'use client';

import { authClient } from '@/lib/auth-client';

export const useAuth = () => {
  const { data: session, ...rest } = authClient.useSession();
  
  const signOut = () => {
    authClient.signOut();
  };

  return {
    session,
    signOut,
    isAuthenticated: !!session?.user,
    user: session?.user,
    ...rest
  };
};