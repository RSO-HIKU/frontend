import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { router } from "expo-router";

import {
  Text,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  TextInput,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { fetchTrails, fetchPeaks } from "./lib/api";
import { assignDistinctColors } from "./utils/colors";
import type { TrailFeature, TrailDto } from "./types/trails";
import { fetchWeatherData } from "./lib/weatherapi";

import { appConfig } from "./lib/appConfig";
import { useAuth } from "./context/AuthContext";
import { getServiceUrl } from "./lib/appConfig";
import { authFetch } from "./lib/authFetch";

// Import Mapbox for native platforms
let Mapbox: any, MapView: any, Camera: any, PointAnnotation: any, ShapeSource: any, LineLayer: any;
if (Platform.OS !== 'web') {
  const MapboxModule = require("@rnmapbox/maps");
  Mapbox = MapboxModule.default;
  MapView = MapboxModule.MapView;
  Camera = MapboxModule.Camera;
  PointAnnotation = MapboxModule.PointAnnotation;
  ShapeSource = MapboxModule.ShapeSource;
  LineLayer = MapboxModule.LineLayer;
  Mapbox.setAccessToken("pk.eyJ1IjoiaXpndWJsamVuaS1wZXNhayIsImEiOiJjbWpuYW51ankwYTloM2NzZGNmYjV6NWNyIn0.VfX9BrjukCgJo8Gal1gurQ");
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiaXpndWJsamVuaS1wZXNhayIsImEiOiJjbWpuYW51ankwYTloM2NzZGNmYjV6NWNyIn0.VfX9BrjukCgJo8Gal1gurQ";
// Map height ~ half of the screen
const MAP_HEIGHT = Math.round(Dimensions.get("window").height * 0.5);

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
    baseUrl: "http://localhost:8082",
    path: "peaks-hikes/hello",
    method: "GET",
  },
  "weather-service": {
    baseUrl: "http://localhost:8086",
    path: "weather/current",
    method: "GET",
  },
};

const PAGES = [
    "My Profile",
  "Social Feed",
  "Scoreboards",
  "Activities",
  "Badges",
  "Peaks & Hikes",
//  "trail-import-service",
 // "weather-service",

];

// Static icon mapping for services (PNG recommended)
// Only include icons that exist in assets/icons/
const ICONS: Record<string, any> = {
  "activity-service": require("../assets/icons/activity-service.png"),
  "badge-service": require("../assets/icons/badge-service.png"),
  "peaks-hikes-service": require("../assets/icons/peaks-hikes-service.png"),
  "Scoreboards": require("../assets/icons/scoreboards-challenges-service.png"),
  "Social Feed": require("../assets/icons/social-feed.png"),
  "My Profile": require("../assets/icons/user-profile.png"),
  // Add more icons as you create them in assets/icons/
};

export default function Index() {
  const screenWidth = Dimensions.get("window").width;
  const isMobile = screenWidth < 768;
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp?: string | null; wind_kmh?: string | null; wind_dir?: string; icon?: string; desc?: string; snow_var_desc?: string; snow_var_unit?: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [maxButtonWidth, setMaxButtonWidth] = useState(160);
  const [leftPanelHeight, setLeftPanelHeight] = useState(0);
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [trailFeatures, setTrailFeatures] = useState<any[]>([]);
  const [trailLoading, setTrailLoading] = useState(false);
  const [peakFeatures, setPeakFeatures] = useState<any[]>([]);
  const [peakLoading, setPeakLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5058, 46.3787]);
  const { ready, authenticated, needsProfile, login, logout, register, getToken } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.replace("/login");
    } else if (needsProfile) {
      // User needs to complete profile (happens after registration)
      router.replace("/finish-signup");
    }
    // If authenticated and has profile, stay on index (home)
  }, [ready, authenticated, needsProfile]);

  const trailCollection = useMemo(
    () => ({ type: "FeatureCollection", features: trailFeatures ?? [] }),
    [trailFeatures]
  );
  
  // Web map ref
  const webMapRef = useRef<any>(null);

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
      const res = await authFetch(url, { method }, getToken);
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

  const fetchTrailsData = useCallback(async () => {
    setTrailLoading(true);
    try {
      console.log("Fetching trails with query:", searchQuery);
      const data: TrailDto[] = await fetchTrails(searchQuery, getToken);
      console.log("Raw API response:", data);

      let features: TrailFeature[] = Array.isArray(data)
        ? data.map((t: TrailDto, idx: number) => ({
            type: "Feature",
            geometry: t.geometry,
            properties: {
              name: t.name ?? `Trail ${idx + 1}`,
              lengthKm: typeof t.lengthKm === 'number' ? t.lengthKm : undefined,
            },
          }))
        : [];

      features = assignDistinctColors(features);
      
      console.log("Transformed features:", features);
      
      setTrailFeatures(features);
      const trailNames = data.map((t: any) => t.name).join(", ");
      const firstCoord = features?.[0]?.geometry?.coordinates?.[0];
      if (Array.isArray(firstCoord) && firstCoord.length === 2) {
        setMapCenter([firstCoord[0], firstCoord[1]]);
      }
      
      setLastResponse(`Fetched ${features.length} trails: ${trailNames}`);
      console.log("MapCenter set to:", firstCoord, "Trails feature count:", features.length);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);
      setLastResponse(`Error fetching trails: ${msg}`);
      Alert.alert("Error", msg);

    } finally {
      setTrailLoading(false);
    }
  }, [searchQuery]);

  const fetchPeaksData = useCallback(async () => {
    setPeakLoading(true);
    try {
      console.log("Fetching peaks with query:", searchQuery);
      const data = await fetchPeaks(searchQuery, getToken);
      console.log("Raw peaks API response:", data);

      const features = Array.isArray(data)
        ? data.map((p: any, idx: number) => ({
            type: "Feature",
            geometry: p.geometry,
            properties: {
              id: p.id,
              name: p.name ?? `Peak ${idx + 1}`,
              territory: p.territory,
              latitude: p.latitude,
              longitude: p.longitude,
              elevationM: p.elevationM,
            },
          }))
        : [];

      console.log("Transformed peak features:", features);
      setPeakFeatures(features);
      const peakNames = data.map((p: any) => p.name).join(", ");
      setLastResponse(`Fetched ${features.length} peaks: ${peakNames}`);
      console.log("Peak feature count:", features.length);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);
      setLastResponse(`Error fetching peaks: ${msg}`);
      Alert.alert("Error", msg);
    } finally {
      setPeakLoading(false);
    }
  }, [searchQuery]);

  // Auto-load trails only after auth is ready and user is authenticated
  useEffect(() => {
    if (!ready || !authenticated) return;
    fetchTrailsData();
    fetchPeaksData();
  }, [ready, authenticated, fetchTrailsData, fetchPeaksData]);

  // Fetch weather once authenticated, and refresh every minute
  React.useEffect(() => {
    if (!ready || !authenticated) return;
    let mounted = true;
    const fetchWeather = async () => {
      try {
        const data = await fetchWeatherData(getToken);
        console.log("[fetchWeather] Fetched data:", data);
        if (mounted) setWeather(data);
      } catch (e) {
        // ignore — optional logging
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 60_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [ready, authenticated, getToken]);

  // Initialize mapbox-gl map on web and add trails layer
  useEffect(() => {
    if (Platform.OS !== 'web' || !webMapRef.current) return;
    
    console.log("Initializing mapbox-gl, webMapRef.current:", webMapRef.current);
    
    // Dynamically import mapbox-gl only on web
    const mapboxgl = require('mapbox-gl');
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Create map if not already created
    if (!webMapRef.current.map) {
      console.log("Creating new mapbox-gl map");
      webMapRef.current.map = new mapboxgl.Map({
        container: webMapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: mapCenter,
        zoom: 10,
      });
    }
    
    const map = webMapRef.current.map;
    
    // Add trails when map is ready (loaded or will load)
    const addTrails = () => {
      console.log("Adding trails. trailFeatures count:", trailFeatures.length);
      console.log("Trail collection:", trailCollection);
      
      // Add trail source and layer when features are available
      if (trailFeatures.length > 0) {
        // Remove old layer and source if they exist
        if (map.getLayer('trails-layer')) {
          console.log("Removing existing trails-layer");
          map.removeLayer('trails-layer');
        }
        if (map.getSource('trails-source')) {
          console.log("Removing existing trails-source");
          map.removeSource('trails-source');
        }
        
        console.log("Adding trails source with data:", trailCollection);
        // Add new source and layer
        map.addSource('trails-source', {
          type: 'geojson',
          data: trailCollection,
        });
        
        console.log("Adding trails layer");
        map.addLayer({
          id: 'trails-layer',
          type: 'line',
          source: 'trails-source',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
        
        console.log("Trails layer added successfully");
      }
      
      // Add peaks
      if (peakFeatures.length > 0) {
        if (map.getLayer('peaks-layer')) {
          console.log("Removing existing peaks-layer");
          map.removeLayer('peaks-layer');
        }
        if (map.getSource('peaks-source')) {
          console.log("Removing existing peaks-source");
          map.removeSource('peaks-source');
        }
        
        console.log("Adding peaks source with data:", { type: 'FeatureCollection', features: peakFeatures });
        map.addSource('peaks-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: peakFeatures },
        });
        
        console.log("Adding peaks layer");
        map.addLayer({
          id: 'peaks-layer',
          type: 'circle',
          source: 'peaks-source',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FF5A5F',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
          },
        });
        
        console.log("Peaks layer added successfully");
      }
      
      // Recenter map
      console.log("Flying to center:", mapCenter);
      map.flyTo({ center: mapCenter, zoom: 10 });
    };
    
    // Ensure we react as soon as the map reports load
    const handleMapLoad = () => {
      console.log("Map load event fired, adding trails");
      addTrails();
    };

    // If map style is already loaded, add trails immediately
    if (map.isStyleLoaded()) {
      console.log("Map style already loaded, adding trails now");
      handleMapLoad();
    } else {
      console.log("Waiting for map to load");
      map.once('load', handleMapLoad);
    }
    
    map.on('error', (e: any) => {
      console.error("Mapbox error:", e);
    });
  }, [trailFeatures, peakFeatures, mapCenter, trailCollection]);

  // Ensure mapbox-gl canvas resizes when container height changes (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const container: any = webMapRef.current;
    const map = container?.map;
    if (!container || !map) return;

    // Force a resize after layout changes
    const resize = () => {
      try {
        map.resize();
      } catch {}
    };
    // Next tick resize to catch React layout update
    const t = setTimeout(resize, 0);

    // Observe container dimension changes (width/height)
    let ro: any;
    if (typeof window !== 'undefined' && (window as any).ResizeObserver) {
      ro = new (window as any).ResizeObserver(() => resize());
      ro.observe(container);
    }

    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
    };
  }, [leftPanelHeight]);

  return (
    <View style={styles.container}>
      {/* Header with title and auth actions */}
      {/* Moved service buttons below into left column */}

      <View style={styles.content}>
        <View style={[styles.headerBar, isMobile && styles.headerBarMobile]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>Welcome to Hiku</Text>
          </View>

          {!isMobile && (
            <View style={styles.headerCenter}>
              {weather ? (
                <View style={styles.inlineWeather}>
                  <Text style={styles.inlineWeatherPrimary}>Kredarica: {weather.temp ?? "--"}°C</Text>
                  <Text style={styles.inlineWeatherSecondary}>veter {weather.wind_dir ?? ""}, {weather.wind_kmh ?? "--"} km/h</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={[styles.authActions, isMobile && styles.authActionsMobile]}>
            {isMobile ? (
              <>
                <TouchableOpacity style={[styles.authButton, styles.authButtonSmall]} onPress={() => login()}>
                  <Text style={[styles.authButtonText, styles.authButtonTextSmall]}>In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.authButton, styles.authButtonSmall, { marginLeft: 4 }]} onPress={() => register()}>
                  <Text style={[styles.authButtonText, styles.authButtonTextSmall]}>Sign up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.authButton, styles.authButtonSmall, { marginLeft: 12 }]} onPress={() => logout()}>
                  <Text style={[styles.authButtonText, styles.authButtonTextSmall]}>Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>

                {!authenticated ? (
                  <>
                    <TouchableOpacity style={styles.authButton} onPress={() => login()}>
                      <Text style={styles.authButtonText}>Log in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.authButton} onPress={() => register()}>
                      <Text style={styles.authButtonText}>Sign up</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={[styles.authButton, { marginLeft: 8 }]} onPress={() => logout()}>
                      <Text style={styles.authButtonText}>Log out</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {isMobile && weather ? (
          <View style={styles.mobileWeatherBar}>
            <Text style={styles.mobileWeatherText}>Kredarica: {weather.temp ?? "--"}°C | {weather.wind_dir ?? ""} {weather.wind_kmh ?? "--"} km/h</Text>
          </View>
        ) : null}

        {/* Two-column layout: left (buttons), right (map) - responsive */}
        <View style={[styles.mainRow, isMobile && styles.mainRowMobile]}>
          {!isMobile && (
            <View style={styles.leftColumn}>
              <View
                style={[styles.sidePanel, sidebarCollapsed ? styles.sidePanelCollapsed : styles.sidePanelExpanded]}
                onLayout={(e) => setLeftPanelHeight(e.nativeEvent.layout.height)}
              >
              <View style={styles.sidePanelHeader}>
                <TouchableOpacity style={styles.collapseToggle} onPress={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  <Text style={styles.collapseToggleText}>{sidebarCollapsed ? "›" : "‹"}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.topMenu}>
                {PAGES.map((s) => {
                  const isLoading = loading === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[sidebarCollapsed ? styles.menuItemCollapsed : styles.menuItem, isLoading && styles.menuItemLoading]}
                      onPress={() => {
                        if (s === "My Profile") {
                          router.push("/my-user-profile");
                        } else if (s === "Social Feed") {
                          router.push("/social-feed");
                        } else if (s === "Scoreboards") {
                          router.push("/scoreboards-challenges");
                        } else if (s === "Badges") {
                          router.push("/badge-service");
                        } else if (s === "Activities") {
                          router.push("/activity-service");
                        } else if (s === "Peaks & Hikes") {
                      //    router.push("/user");
                        } else {
                          triggerService(s);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {/* Icon from assets/icons/<service>.png */}
                      {!failedIcons[s] && ICONS[s] ? (
                        <Image
                          source={ICONS[s]}
                          style={styles.serviceIconImg}
                          resizeMode="contain"
                          onError={() => {
                            if (!failedIcons[s]) {
                              setFailedIcons((prev) => ({ ...prev, [s]: true }));
                            }
                          }}
                        />
                      ) : (
                        <Text style={styles.serviceIconText}>🔧</Text>
                      )}
                      {!sidebarCollapsed && <Text style={styles.menuText}>{s}</Text>}
                      {isLoading && (
                        <ActivityIndicator style={styles.indicator} size="small" color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
          )}

          {isMobile && !sidebarCollapsed && (
            <View style={styles.mobileSidebar}>
              <View style={styles.sidePanelHeader}>
                <TouchableOpacity style={styles.collapseToggle} onPress={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  <Text style={styles.collapseToggleText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.mobileMenuScroll}>
                <View style={styles.topMenu}>
                  {PAGES.map((s) => {
                    const isLoading = loading === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.menuItemMobile, isLoading && styles.menuItemLoading]}
                        onPress={() => {
                          if (s === "My Profile") {
                            router.push("/my-user-profile");
                          } else if (s === "Social Feed") {
                            router.push("/social-feed");
                          } else if (s === "Scoreboards") {
                            router.push("/scoreboards-challenges");
                          } else if (s === "badge-service") {
                            router.push("/badge-service");
                          } else if (s === "activity-service") {
                            router.push("/activity-service");
                          } else {
                            triggerService(s);
                          }
                          setSidebarCollapsed(true);
                        }}
                        activeOpacity={0.7}
                      >
                        {!failedIcons[s] && ICONS[s] ? (
                          <Image
                            source={ICONS[s]}
                            style={styles.serviceIconImg}
                            resizeMode="contain"
                            onError={() => {
                              if (!failedIcons[s]) {
                                setFailedIcons((prev) => ({ ...prev, [s]: true }));
                              }
                            }}
                          />
                        ) : (
                          <Text style={styles.serviceIconText}>🔧</Text>
                        )}
                        <Text style={styles.menuText}>{s}</Text>
                        {isLoading && (
                          <ActivityIndicator style={styles.indicator} size="small" color="#fff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={[styles.rightColumn, isMobile && styles.rightColumnMobile]}>
            <View style={styles.searchBarContainer}>
              <TextInput
                placeholder="Search for trails and peaks..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => { fetchTrails(undefined, getToken); fetchPeaks(undefined, getToken); }}
                returnKeyType="search"
                style={styles.searchInput}
              />
              <TouchableOpacity style={styles.searchButton} onPress={() => { fetchTrails(undefined, getToken); fetchPeaks(undefined, getToken); }} disabled={trailLoading || peakLoading}>
                <Text style={styles.searchButtonText}>{(trailLoading || peakLoading) ? "…" : "🔍"}</Text>
              </TouchableOpacity>
            </View>
            {/* Mapbox Map - Native platforms */}
            {Platform.OS !== 'web' && (
              <View style={[styles.mapContainer, leftPanelHeight && !isMobile ? { height: leftPanelHeight } : isMobile ? { height: 300 } : null]}>
                <MapView style={styles.map}>
                  <Camera zoomLevel={8} centerCoordinate={mapCenter} />
                  {trailFeatures.length > 0 && (
                    <ShapeSource
                      id="trails-source"
                      shape={{ type: "FeatureCollection", features: trailFeatures }}
                    >
                      <LineLayer
                        id="trails-line"
                        style={{ lineColor: "#FF5A5F", lineWidth: 4, lineOpacity: 0.8, lineCap: "round", lineJoin: "round" }}
                      />
                    </ShapeSource>
                  )}
                  {peakFeatures.map((peak: any, idx: number) => (
                    <PointAnnotation
                      key={`peak-${peak.properties.id ?? idx}`}
                      id={`peak-${peak.properties.id ?? idx}`}
                      coordinate={peak.geometry.coordinates}
                    >
                      <View style={styles.peakMarkerContainer}>
                        <Text style={styles.peakMarkerText}>📍</Text>
                      </View>
                    </PointAnnotation>
                  ))}
                </MapView>
              </View>
            )}

            {/* Mapbox Map - Web using mapbox-gl */}
            {Platform.OS === 'web' && (
              <div style={{ width: '100%', height: isMobile ? 300 : (leftPanelHeight || 400), borderRadius: 8, overflow: 'hidden' }} ref={webMapRef} />
            )}

            {(trailFeatures.length > 0 || peakFeatures.length > 0) && (
              <View style={[styles.listsRow, isMobile && styles.listsRowMobile]}>
                {trailFeatures.length > 0 && (
                  <View style={styles.listColumn}>
                    <View style={styles.trailsListContainer}>
                      <Text style={styles.trailsListHeader}>Trails ({trailFeatures.length})</Text>
                      <ScrollView style={styles.trailsScroll}>
                        {trailFeatures.map((f: any, idx: number) => (
                          <View key={`${f?.properties?.name ?? idx}-${idx}`} style={styles.trailItem}>
                            <View style={[styles.trailColorDot, { backgroundColor: f?.properties?.color ?? '#999' }]} />
                            <Text style={styles.trailName}>
                              {f?.properties?.name ?? `Trail ${idx + 1}`}
                              {typeof f?.properties?.lengthKm === 'number'
                                ? ` (${Number(f?.properties?.lengthKm).toFixed(2)} km)`
                                : ''}
                            </Text>
                            <TouchableOpacity
                              style={styles.addToActivityButton}
                              onPress={() => router.push({
                                pathname: "/activity-service",
                                params: { trailName: f?.properties?.name ?? `Trail ${idx + 1}` }
                              })}
                            >
                              <Text style={styles.addToActivityButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}

                {peakFeatures.length > 0 && (
                  <View style={styles.listColumn}>
                    <View style={styles.trailsListContainer}>
                      <Text style={styles.trailsListHeader}>Peaks ({peakFeatures.length})</Text>
                      <ScrollView style={styles.trailsScroll}>
                        {peakFeatures.map((f: any, idx: number) => (
                          <View key={`${f?.properties?.id ?? idx}-${idx}`} style={styles.trailItem}>
                            <Text style={styles.peakMarkerText}>📍</Text>
                            <Text style={styles.trailName}>
                              {f?.properties?.name ?? `Peak ${idx + 1}`}
                              {typeof f?.properties?.elevationM === 'number'
                                ? ` (${Number(f?.properties?.elevationM).toFixed(0)} m)`
                                : ''}
                              {f?.properties?.territory ? ` - ${f.properties.territory}` : ''}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={[styles.responseBox, isMobile && styles.responseBoxMobile]}>
          <Text style={[styles.responseLabel, isMobile && styles.responseLabelMobile]}>Last response</Text>
          <Text style={[styles.responseText, isMobile && styles.responseTextMobile]} numberOfLines={isMobile ? 3 : 6}>
            {lastResponse ?? "No requests yet."}
          </Text>
        </View>

        {isMobile && !sidebarCollapsed && (
          <TouchableOpacity style={styles.mobileMenuToggle} onPress={() => setSidebarCollapsed(true)}>
            <Text style={styles.mobileMenuToggleText}>✕</Text>
          </TouchableOpacity>
        )}

        {isMobile && sidebarCollapsed && (
          <TouchableOpacity style={styles.mobileMenuButton} onPress={() => setSidebarCollapsed(false)}>
            <Text style={styles.mobileMenuButtonText}>☰</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Background hero image with blur */}
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
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  mobileMenuScroll: {
    flex: 1,
    maxHeight: "80%",
  },
  sidePanel: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sidePanelCollapsed: {
    width: 56,
  },
  sidePanelExpanded: {
    width: 200,
  },
  sidePanelHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  collapseToggle: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  collapseToggleText: { color: "#333", fontWeight: "700", fontSize: 16 },
  menuItem: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginBottom: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  menuItemCollapsed: {
    backgroundColor: "#007AFF",
    width: 44,
    height: 44,
    marginHorizontal: 6,
    marginBottom: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLoading: {
    opacity: 0.9,
  },
  serviceIconImg: { width: 22, height: 22, marginRight: 8 },
  serviceIconText: { color: "#fff", fontSize: 18, marginRight: 8 },
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
  weatherBox: {
    position: "absolute",
    // place the weather box in the top-right corner so it sits near the
    // header and aligned to the right edge of the screen
    top: 12,
    right: 8,
    width: 150,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 20,
  },
  weatherLoc: { fontSize: 13, color: "#555", fontWeight: "600", marginBottom: 4 },
  weatherTemp: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  weatherLine: { fontSize: 13, color: "#333" },
  mainRow: { flexDirection: "row", alignItems: "stretch", gap: 16, flex: 1, width: "100%" },
  mainRowMobile: { flexDirection: "column", gap: 8 },
  leftColumn: { flexShrink: 0 },
  rightColumn: { flex: 1 },
  rightColumnMobile: { flex: 1, minHeight: 500 },
  mobileSidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "75%",
    backgroundColor: "rgba(255,255,255,0.98)",
    zIndex: 100,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  searchBarContainer: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    flex: 1,
  },
  searchButton: {
    marginLeft: 8,
    height: 42,
    width: 46,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: { color: "#fff", fontSize: 18 },
  mapContainer: { width: "100%", borderRadius: 8, overflow: "hidden" },
  map: { flex: 1 },
  markerContainer: { alignItems: "center", justifyContent: "center" },
  markerText: { fontSize: 30 },
  peakMarkerContainer: { alignItems: "center", justifyContent: "center" },
  peakMarkerText: { fontSize: 24 },
  listsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 12,
  },
  listsRowMobile: {
    flexDirection: "column",
    gap: 8,
  },
  listColumn: {
    flex: 1,
  },
  content: { flex: 1, padding: 18, alignItems: "flex-start" },
  headerBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerBarMobile: {
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1 },
  headerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  mobileWeatherBar: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  mobileWeatherText: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  inlineWeather: { alignItems: "center" },
  inlineWeatherPrimary: { fontSize: 16, fontWeight: "700", color: "#333" },
  inlineWeatherSecondary: { fontSize: 12, color: "#555" },
  title: { fontSize: 22, fontWeight: "700" },
  titleMobile: { fontSize: 16, fontWeight: "700" },
  authActions: { flexDirection: "row", alignItems: "center" },
  authActionsMobile: { gap: 2 },
  authButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  authButtonSmall: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  authButtonText: { color: "#fff", fontWeight: "600" },
  authButtonTextSmall: { fontSize: 11 },
  hint: { color: "#666", marginBottom: 18, fontSize: 16 },
  responseBox: {
    width: "100%",
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 6,
  },
  responseBoxMobile: {
    padding: 8,
    marginBottom: 60,
  },
  responseLabel: { color: "#333", fontWeight: "600", marginBottom: 6, fontSize: 16 },
  responseLabelMobile: { fontSize: 13 },
  responseText: { color: "#222", fontSize: 16 },
  responseTextMobile: { fontSize: 12 },
  // Trails list styles
  trailsListContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    padding: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  trailsListHeader: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 6 },
  trailsScroll: { maxHeight: 180 },
  trailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  trailColorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  trailName: { fontSize: 15, color: "#222", flex: 1 },
  addToActivityButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  addToActivityButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  menuItemMobile: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 6,
    marginBottom: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  mobileMenuToggle: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  mobileMenuToggleText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  mobileMenuButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  mobileMenuButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});
