import React, { useCallback, useState, useRef, useMemo, useEffect } from "react";
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
  FlatList,
  Modal,
} from "react-native";
import Constants from "expo-constants";
import { fetchPeaks } from "./lib/api";
import { appConfig, getServiceUrl } from "./lib/appConfig";
import { useAuth } from "./context/AuthContext";
import type { PeakDto } from "./lib/api";
import type { LogbookEntry } from "./types/peaks";
import { authFetch } from "./lib/authFetch";

// Gateway URL for badge service
const BADGE_API_URL = getServiceUrl("/api/badges");

const PAGES = [
  "My Profile",
  "Social Feed",
  "Scoreboards",
  "activity-service",
  "badge-service",
  "peaks-hikes-service",
];

const ICONS: Record<string, any> = {
  "activity-service": require("../assets/icons/activity-service.png"),
  "badge-service": require("../assets/icons/badge-service.png"),
  "peaks-hikes-service": require("../assets/icons/peaks-hikes-service.png"),
  "scoreboards-challenges-service": require("../assets/icons/scoreboards-challenges-service.png"),
};

const MAX_VISIBLE_SEARCH_RESULTS = 4;
const MAX_VISIBLE_LOGBOOK_RESULTS = 4;

export default function BadgeServicePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [maxButtonWidth, setMaxButtonWidth] = useState(160);
  const [leftPanelHeight, setLeftPanelHeight] = useState(0);
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});
  
  // Peak search
  const [peakSearchQuery, setPeakSearchQuery] = useState("");
  const [peakSearchResults, setPeakSearchResults] = useState<PeakDto[]>([]);
  const [peakLoading, setPeakLoading] = useState(false);
  
  // Logbook
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
  const [logbookLoading, setLogbookLoading] = useState(false);
  
  // Modal for adding peak
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeak, setSelectedPeak] = useState<PeakDto | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { ready, authenticated, login, logout, register, getToken, getUserId } = useAuth();
  const userId = getUserId();
  
  useEffect(() => {
      if (!ready) return;
      if (!authenticated) router.replace("/login");
    }, [ready, authenticated]);

  useEffect(() => {
    if (userId) {
      fetchLogbook();
    }
  }, [userId]);

  const navigateToPage = useCallback((pageName: string) => {
    setLoading(pageName);
    try {
      if (pageName === "My Profile") {
        router.push("/my-user-profile");
      } else if (pageName === "Social Feed") {
        router.push("/social-feed");
      } else if (pageName === "Scoreboards") {
        router.push("/scoreboards-challenges");
      } else if (pageName === "activity-service") {
        router.push("/activity-service");
      } else if (pageName === "badge-service") {
        router.push("/badge-service");
      } else if (pageName === "peaks-hikes-service") {
        router.push("/");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Navigation failed");
    } finally {
      setLoading(null);
    }
  }, []);

  const searchPeaks = useCallback(async () => {
    setPeakLoading(true);
    try {
      const data: PeakDto[] = await fetchPeaks(peakSearchQuery, getToken);
      setPeakSearchResults(data);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to fetch peaks");
      setPeakSearchResults([]);
    } finally {
      setPeakLoading(false);
    }
  }, [peakSearchQuery]);

  const addToLogbook = async (peakId: number, peakName: string) => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }
    
    try {
      const res = await authFetch(`${BADGE_API_URL}/logbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          peakId: peakId,
          notes: notesInput || peakName
        })
      }, getToken);
      if (!res.ok) throw new Error("Failed to add to logbook");
      Alert.alert("Success", `Added ${peakName} to logbook`);
      setModalVisible(false);
      setNotesInput("");
      setSelectedPeak(null);
      await fetchLogbook();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to add to logbook");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchLogbook = async () => {
    if (!userId) return;
    
    setLogbookLoading(true);
    try {
      const res = await authFetch(`${BADGE_API_URL}/logbook?userId=${encodeURIComponent(userId)}`, { method: "GET" }, getToken);
      if (!res.ok) throw new Error("Failed to fetch logbook");
      const data = await res.json();
      setLogbookEntries(data.map((entry: any) => ({
        id: entry.id,
        peakId: entry.peakId,
        peakName: entry.peakName || String(entry.peakId),
        territory: entry.territory || "—",
        elevation: entry.elevationM || undefined,
        addedAt: entry.addedAt,
        notes: entry.notes
      })));
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to fetch logbook");
    } finally {
      setLogbookLoading(false);
    }
  };

  useEffect(() => {
    fetchLogbook();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Badge Service</Text>
          </View>
          <View style={styles.authActions}>
            {!authenticated ? (
              <>
                <TouchableOpacity style={styles.authButton} onPress={register}>
                  <Text style={styles.authButtonText}>Sign up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.authButton, { marginLeft: 8 }]} onPress={login}>
                  <Text style={styles.authButtonText}>Log in</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.authButton} onPress={logout}>
                <Text style={styles.authButtonText}>Log out</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Two-column layout */}
        <View style={styles.mainRow}>
          {/* Left Sidebar */}
          <View style={styles.leftColumn}>
            <View
              style={[styles.sidePanel, sidebarCollapsed ? styles.sidePanelCollapsed : { width: maxButtonWidth + 28 }]}
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
                      onPress={() => navigateToPage(s)}
                      activeOpacity={0.7}
                      onLayout={!sidebarCollapsed ? (e) => {
                        const w = e.nativeEvent.layout.width;
                        setMaxButtonWidth((prev) => (w > prev ? w : prev));
                      } : undefined}
                    >
                      {!failedIcons[s] && ICONS[s] ? (
                        <Image
                          source={ICONS[s]}
                          style={styles.serviceIconImg}
                          resizeMode="contain"
                          onError={() => setFailedIcons((prev) => ({ ...prev, [s]: true }))}
                        />
                      ) : (
                        <Text style={styles.serviceIconText}>🔧</Text>
                      )}
                      {!sidebarCollapsed && <Text style={styles.menuText}>{s}</Text>}
                      {isLoading && <ActivityIndicator style={styles.indicator} size="small" color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Right Content */}
          <View style={styles.rightColumn}>
            <ScrollView style={{ flex: 1 }}>
              {/* Peak Search Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Search Peaks</Text>
                <View style={styles.searchBarContainer}>
                  <TextInput
                    placeholder="Search for peaks..."
                    placeholderTextColor="#666"
                    value={peakSearchQuery}
                    onChangeText={setPeakSearchQuery}
                    onSubmitEditing={searchPeaks}
                    returnKeyType="search"
                    style={styles.searchInput}
                  />
                  <TouchableOpacity style={styles.searchButton} onPress={searchPeaks} disabled={peakLoading}>
                    <Text style={styles.searchButtonText}>{peakLoading ? "…" : "🔍"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Peak Search Results Table */}
                {peakSearchResults.length > 0 && (
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>Peak Name</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableHeaderCellCenter, { flex: 1 }]}>Elevation</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableHeaderCellCenter, { flex: 1 }]}>Territory</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableHeaderCellCenter, { flex: 1 }]}>Add to logbook</Text>
                    </View>
                    <FlatList
                      data={peakSearchResults}
                      keyExtractor={(item) => String(item.id)}
                      scrollEnabled
                      style={{ maxHeight: MAX_VISIBLE_SEARCH_RESULTS * 56 }}
                      renderItem={({ item, index }) => (
                        <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                          <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>
                            {item.elevationM?.toFixed(0) || "—"} m
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>
                            {item.territory || "—"}
                          </Text>
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                              setSelectedPeak(item);
                              setNotesInput("");
                              setModalVisible(true);
                            }}
                          >
                            <Text style={styles.addButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  </View>
                )}
              </View>

              {/* Logbook Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Logbook ({logbookEntries.length})</Text>
                {logbookLoading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : logbookEntries.length > 0 ? (
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.5 }]}>Peak Name</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableHeaderCellCenter, { flex: 1.2 }]}>Territory</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableHeaderCellCenter, { flex: 1 }]}>Elevation</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableHeaderCellCenter, { flex: 1.2 }]}>Added At</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableHeaderCellCenter, { flex: 1.2 }]}>Notes</Text>
                    </View>
                    <FlatList
                      data={logbookEntries}
                      keyExtractor={(item) => String(item.id)}
                      scrollEnabled={logbookEntries.length > MAX_VISIBLE_LOGBOOK_RESULTS}
                      style={{ maxHeight: MAX_VISIBLE_LOGBOOK_RESULTS * 56 }}
                      renderItem={({ item, index }) => (
                        <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                          <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                            {item.peakName || "—"}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>
                            {item.territory || "—"}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>
                            {item.elevation ? `${item.elevation.toFixed(0)} m` : "—"}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>
                            {item.addedAt || "—"}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>
                            {item.notes || "—"}
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No peaks in your logbook yet</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
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

      {/* Add to Logbook Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setNotesInput("");
          setSelectedPeak(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPeak && (
              <>
                <Text style={styles.modalTitle}>
                  Are you currently located at peak{"\n"}
                  <Text style={styles.modalPeakName}>
                    {selectedPeak.name}
                  </Text>
                  {selectedPeak.elevationM && (
                    <Text>, {selectedPeak.elevationM.toFixed(0)}m</Text>
                  )}
                  ?
                </Text>

                <Text style={styles.modalSubtitle}>This entry will be added to your logbook</Text>

                <TextInput
                  placeholder="Add your notes, memories here..."
                  placeholderTextColor="#999"
                  value={notesInput}
                  onChangeText={setNotesInput}
                  multiline
                  numberOfLines={4}
                  style={styles.modalTextInput}
                />

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      setNotesInput("");
                      setSelectedPeak(null);
                    }}
                    disabled={isSaving}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSaveButton, isSaving && styles.modalSaveButtonDisabled]}
                    onPress={() => {
                      if (selectedPeak) {
                        setIsSaving(true);
                        addToLogbook(selectedPeak.id, selectedPeak.name);
                      }
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalSaveText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 18 },
  headerBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700" },
  authActions: { flexDirection: "row", alignItems: "center" },
  authButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  authButtonText: { color: "#fff", fontWeight: "600" },
  mainRow: { flexDirection: "row", alignItems: "stretch", gap: 16, flex: 1, width: "100%" },
  leftColumn: { flexShrink: 0 },
  rightColumn: { flex: 1 },
  sidePanel: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sidePanelCollapsed: { width: 56 },
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
  topMenu: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: "column",
    alignItems: "flex-start",
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
  menuItemLoading: { opacity: 0.9 },
  serviceIconImg: { width: 22, height: 22, marginRight: 8 },
  serviceIconText: { color: "#fff", fontSize: 18, marginRight: 8 },
  menuText: { color: "#fff", fontWeight: "600", marginRight: 6, fontSize: 16 },
  indicator: { marginLeft: 0 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#333" },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  tableHeaderCell: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  tableHeaderCellCenter: {
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableRowAlt: { backgroundColor: "#f9f9f9" },
  tableCell: {
    fontSize: 14,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 16,
    fontSize: 14,
  },
  heroWrapper: {
    position: "absolute",
    top: 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  modalPeakName: {
    fontWeight: "700",
    color: "#007AFF",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  modalCancelText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
