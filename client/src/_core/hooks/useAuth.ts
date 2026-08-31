import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

// S2 Studio — Auto-login bypass: sempre retorna um usuário mockado
// sem necessidade de autenticação externa.

const S2_AUTO_USER = {
  id: 1,
  openId: "s2-owner",
  name: "S2 Studio Admin",
  email: "admin@s2.studio",
  loginMethod: "auto",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const utils = trpc.useUtils();

  // Try to get real user, but always fall back to auto-user
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
        return;
      }
    } finally {
      try { sessionStorage.removeItem("manus-cookie"); } catch {}
      utils.auth.me.setData(undefined, null);
    }
  }, [logoutMutation, utils]);

  // AUTO-LOGIN: Se não há usuário autenticado, usa o usuário automático
  const state = useMemo(() => {
    const user = meQuery.data ?? S2_AUTO_USER;
    return {
      user,
      loading: false, // Nunca bloqueia com loading
      error: null,
      isAuthenticated: true, // Sempre autenticado
    };
  }, [meQuery.data]);

  // Auto-create session on mount if not authenticated
  useEffect(() => {
    if (!meQuery.data && !meQuery.isLoading) {
      // Tentar auto-login via dev-login
      fetch("/api/dev-login").then(() => {
        utils.auth.me.invalidate();
      }).catch(() => {
        // Silently fail — we have the mock user anyway
      });
    }
  }, [meQuery.data, meQuery.isLoading, utils]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
