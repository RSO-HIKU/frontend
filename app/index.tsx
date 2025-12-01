import React, { useCallback, useState } from "react";
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import Constants from "expo-constants";

// Resolve backend base URL depending on platform with an optional override
// order (highest precedence): Expo app config extra.BACKEND_URL or process.env.BACKEND_URL,
// then platform-specific defaults.
const _envBackend = (Constants?.manifest?.extra && (Constants.manifest.extra as any).BACKEND_URL) || process.env.BACKEND_URL;
const BASE_URL =
  _envBackend ?? (Platform.OS === "web" ? "http://localhost:8080" : Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080");

// Notes:
// - For Expo web builds this will use http://localhost:8080 by default.
// - For Android emulator use 10.0.2.2 which maps to host machine's localhost.
// - You can override BASE_URL by adding `extra: { BACKEND_URL: "http://..." }` to app.json/app.config.js.

// Per-service overrides: path, HTTP method and (optional) baseUrl.
// We include the peaks-hikes-service mapping to call the endpoint you mentioned.
const SERVICE_CONFIG: Record<
  string,
  { path?: string; method?: "GET" | "POST" | string; baseUrl?: string }
> = {
  "peaks-hikes-service": {
    // Your curl used: http://localhost:8082/peaks-hikes/hello (GET)
    baseUrl: "http://localhost:8082",
    path: "peaks-hikes/hello",
    method: "GET",
  },
};

const SERVICES = [
  "activity-service",
  "authentication-service",
  "badge-service",
  "gateway-service",
  "notification-service",
  "peaks-hikes-service",
  "scoreboards-challenges-service",
  "social-feed-service",
  "trail-import-service",
  "user-service",
  "weather-service",
];

export default function Index() {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const triggerService = useCallback(async (serviceName: string) => {
    setLoading(serviceName);
    setLastResponse(null);
    try {
      const cfg = SERVICE_CONFIG[serviceName] ?? {};
      const base = cfg.baseUrl ?? BASE_URL;
      // default path: <serviceName>/hello (you can change this per-service above)
      const path = cfg.path ?? `${serviceName}/hello`;
      const method = cfg.method ?? "POST";

      const url = `${base}/${path}`;
      const res = await fetch(url, { method });
      const text = await res.text();
      if (!res.ok) {
        const msg = `Failed: ${res.status} ${res.statusText}`;
        setLastResponse(msg + (text ? ` - ${text}` : ""));
        Alert.alert("Error", `${serviceName} -> ${msg}`);
      } else {
        setLastResponse(text || `Triggered ${serviceName} (no body)`);
        Alert.alert("Success", `Triggered ${serviceName}`);
      }
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);
      setLastResponse(`Error: ${msg}`);
      Alert.alert("Error", msg);
    } finally {
      setLoading(null);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topMenuWrap}>
        <View style={styles.topMenu}>
          {SERVICES.map((s) => {
            const isLoading = loading === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.menuItem, isLoading && styles.menuItemLoading]}
                onPress={() => triggerService(s)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuText}>{s}</Text>
                {isLoading && (
                  <ActivityIndicator
                    style={styles.indicator}
                    size="small"
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Hiku mobile — service trigger panel</Text>
        <Text style={styles.hint}>
          Tap a service above to trigger a background microservice call.
        </Text>

        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Last response</Text>
          <Text style={styles.responseText} numberOfLines={6}>
            {lastResponse ?? "No requests yet."}
          </Text>
        </View>
      </View>
      {/* Decorative background image placed under the UI (blurred and low opacity).
          It is positioned absolutely and set to ignore pointer events so it doesn't
          intercept touches. Place Triglav.jpg in hiku-mobile/assets/images/Triglav.jpg */}
      <View style={styles.heroWrapper} pointerEvents="none">
        <Image
          source={require("../assets/images/Triglav.jpg")}
          style={styles.heroImageAbsoluteInner}
          resizeMode="cover"
          blurRadius={4}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topMenuWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    backgroundColor: "#f8f8f8",
  },
  topMenu: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  menuItem: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginBottom: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemLoading: {
    opacity: 0.9,
  },
  menuText: { color: "#fff", fontWeight: "600", marginRight: 6, fontSize: 16 },
  indicator: { marginLeft: 0 },
  heroImage: { width: "100%", height: 200 },
  heroImageAbsolute: {
    position: "absolute",
    top: 56, // keep below the top menu height
    left: 0,
    right: 0,
    bottom: 0,
    width: undefined,
    height: undefined,
    opacity: 0.28,
    zIndex: -1,
  },
  heroWrapper: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  heroImageAbsoluteInner: {
    width: "100%",
    height: "100%",
    opacity: 0.70,
  },
  content: { flex: 1, padding: 18, alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  hint: { color: "#666", marginBottom: 18, fontSize: 16 },
  responseBox: {
    width: "100%",
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 6,
  },
  responseLabel: { color: "#333", fontWeight: "600", marginBottom: 6, fontSize: 16 },
  responseText: { color: "#222", fontSize: 16 },
});
