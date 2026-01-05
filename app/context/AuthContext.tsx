import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { getKeycloak } from "../lib/keycloak";
import { checkUserExists } from "../lib/userApi";

type AuthCtx = {
  ready: boolean;
  authenticated: boolean;
  needsProfile: boolean;
  checkProfile: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: () => Promise<void>;
  getToken: () => Promise<string | null>;
  getUserId: () => string | null;
  getUserInfo: () => { email?: string; username?: string; fullName?: string } | null;
  getUsername: () => string | null; // Add this
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  const kc = useMemo(() => (Platform.OS === "web" ? getKeycloak() : null), []);

  async function checkProfile() {
    if (!kc || !authenticated) return;
    
    const userId = (kc as any).tokenParsed?.sub;
    if (!userId) return;

    const exists = await checkUserExists(userId);
    setNeedsProfile(!exists);
  }

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
        
        if (ok) {
          // Check if user profile exists in database
          const userId = (kc as any).tokenParsed?.sub;
          if (userId) {
            const exists = await checkUserExists(userId);
            setNeedsProfile(!exists);
          }
        }
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

  function getUserInfo(): { email?: string; username?: string; fullName?: string } | null {
    if (!kc) return null;
    const parsed = (kc as any).tokenParsed;
    if (!parsed) return null;
    
    return {
      email: parsed.email,
      username: parsed.preferred_username || parsed.username,
      fullName: parsed.name,
    };
  }

  function getUsername(): string | null {
    if (!kc) return null;
    const parsed = (kc as any).tokenParsed;
    if (!parsed) return null;
    return parsed.preferred_username || parsed.username || parsed.name || null;
  }

  return (
    <Ctx.Provider value={{ ready, authenticated, needsProfile, checkProfile, login, logout, register, getToken, getUserId, getUserInfo, getUsername }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
