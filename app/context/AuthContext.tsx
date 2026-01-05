import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { getKeycloak } from "../lib/keycloak";

type AuthCtx = {
  ready: boolean;
  authenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: () => Promise<void>;
  getToken: () => Promise<string | null>;
  getUserId: () => string | null; // keep nullable
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const kc = useMemo(() => (Platform.OS === "web" ? getKeycloak() : null), []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!kc) {
        // If you run native later, you’ll replace this with a native auth solution.
        if (mounted) {
          setReady(true);
          setAuthenticated(false);
        }
        return;
      }

      const ok = await kc.init({
        onLoad: "check-sso",       // does not force login; just checks existing SSO session
        pkceMethod: "S256",
        flow: "standard",
        responseMode: "query",
        enableLogging: true,
        checkLoginIframe: false,
      });

      console.log("[Auth] Keycloak init result:", ok, "token:", kc.token ? "present" : "missing");

      if (mounted) {
        setAuthenticated(ok);
        setReady(true);
      }
    }

    init().catch(() => {
      if (mounted) {
        setAuthenticated(false);
        setReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [kc]);

  async function login() {
    if (!kc) return;
    // Use Keycloak's built-in login which handles the redirect properly
    await kc.login({
      redirectUri: window.location.origin + "/",
    });
  }

  async function logout() {
    if (!kc) return;
    await kc.logout({ redirectUri: window.location.origin + "/" });
  }

  async function register() {
    if (!kc) return;
    await kc.login({ action: "register", redirectUri: window.location.origin + "/" });
  }

  async function getToken(): Promise<string | null> {
    if (!kc || !kc.token) return null;

    // Refresh if token expires within 30s
    const refreshed = await kc.updateToken(30).catch(() => false);
    if (!refreshed && !kc.token) return null;

    return kc.token ?? null;
  }

  function getUserId(): string | null {
    if (!kc) return null;
    return (kc as any).tokenParsed?.sub ?? null;
  }

  return (
    <Ctx.Provider value={{ ready, authenticated, login, logout, register, getToken, getUserId }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
