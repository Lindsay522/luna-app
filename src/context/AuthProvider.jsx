import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, clearToken, getToken, setToken } from "../api/client.js";
import { AuthContext } from "./authContext.js";
import { SESSION_DISMISS_KEY } from "../sync/migrationState.js";

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);

  const refreshMe = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api("/auth/me");
      setUser(me);
      setLastError(null);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email, password) => {
    setLastError(null);
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.access_token);
    await refreshMe();
  }, [refreshMe]);

  const register = useCallback(async (email, password) => {
    setLastError(null);
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setLastError(null);
    queryClient.clear();
    try {
      sessionStorage.removeItem(SESSION_DISMISS_KEY);
    } catch {
      /* ignore */
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      token: getToken(),
      loading,
      lastError,
      setLastError,
      login,
      register,
      logout,
      refreshMe,
      isCloud: !!user,
    }),
    [user, loading, lastError, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
