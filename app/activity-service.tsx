import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";

export default function ActivityServicePage() {
  const params = useLocalSearchParams();
  const initialTrailName = params.trailName as string | undefined;
  
  const [dateTime, setDateTime] = useState("");
  const [planText, setPlanText] = useState("");
  const [trailName, setTrailName] = useState<string | undefined>(initialTrailName);

  const handleDateTimeChange = (event: any) => {
    if (Platform.OS === "web") {
      setDateTime(event.target.value);
    }
  };

  const handleSavePlan = () => {
    // Simulate save
    Alert.alert("Success", "Your adventure plan has been saved!");
    
    // Clear all entries
    setDateTime("");
    setPlanText("");
    setTrailName(undefined);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerRight} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Activity Service</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Main Content */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContainer}>
            <Text style={styles.mainTitle}>Let's plan a new adventure</Text>

            {/* Date and Time Input */}
            <View style={styles.datePickerContainer}>
              {Platform.OS === "web" ? (
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={handleDateTimeChange}
                  style={{
                    width: "100%",
                    maxWidth: 400,
                    height: 56,
                    borderRadius: 8,
                    border: "2px solid #007AFF",
                    paddingLeft: 20,
                    paddingRight: 20,
                    backgroundColor: "#fff",
                    fontSize: 16,
                    textAlign: "center",
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <TextInput
                  placeholder="Select date and time"
                  placeholderTextColor="#999"
                  value={dateTime}
                  onChangeText={setDateTime}
                  style={styles.dateInput}
                />
              )}
            </View>

            {/* Trail Name Display (if provided) */}
            {trailName && (
              <View style={styles.trailNameContainer}>
                <View style={styles.trailNameContent}>
                  <View>
                    <Text style={styles.trailNameLabel}>Selected Trail:</Text>
                    <Text style={styles.trailNameText}>{trailName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeTrailButton}
                    onPress={() => setTrailName(undefined)}
                  >
                    <Text style={styles.removeTrailButtonText}>−</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Plan Text Box */}
            <TextInput
              placeholder="Write a brief plan"
              placeholderTextColor="#999"
              value={planText}
              onChangeText={setPlanText}
              multiline
              numberOfLines={6}
              style={styles.planInput}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSavePlan}>
              <Text style={styles.saveButtonText}>Save Plan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 18,
    zIndex: 1,
  },
  headerBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  headerRight: {
    width: 80,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 40,
  },
  trailNameContainer: {
    width: "100%",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trailNameContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trailNameLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  trailNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  removeTrailButton: {
    backgroundColor: "#FF3B30",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  removeTrailButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  datePickerContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
  },
  dateInput: {
    width: "100%",
    maxWidth: 400,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#007AFF",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  planInput: {
    width: "100%",
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    textAlignVertical: "top",
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 200,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
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
    opacity: 0.7,
  },
});
