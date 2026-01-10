import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { createUserProfile } from "./lib/userApi";

export default function FinishSignup() {
  const { getUserId, getUserInfo, checkProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email?: string; username?: string; fullName?: string } | null>(null);
  const [formData, setFormData] = useState({
    bio: "",
  });

  useEffect(() => {
    const info = getUserInfo();
    setUserInfo(info);
    
    if (!info?.email || !info?.username) {
      Alert.alert("Error", "Unable to get user information from Keycloak");
    }
  }, []);

  const handleSubmit = async () => {
    const userId = getUserId();
    if (!userId || !userInfo?.email || !userInfo?.username) {
      Alert.alert("Error", "Unable to get user information from Keycloak");
      return;
    }

    setLoading(true);
    try {
      const userData = {
        id: userId,
        username: userInfo.username,
        email: userInfo.email,
        fullName: userInfo.fullName || undefined,
        bio: formData.bio.trim() || undefined,
      };
      console.log("Submitting user data:", userData);
      await createUserProfile(userData);
      console.log("User profile created successfully");
      await checkProfile(); // Refresh the profile status
      router.replace("/");
    } catch (error) {
      console.error("Failed to create user profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Your basic information is already set from Keycloak. Please add some additional details.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{userInfo?.username || "Loading..."}</Text>
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{userInfo?.email || "Loading..."}</Text>
          </View>

          {userInfo?.fullName && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{userInfo.fullName}</Text>
              </View>
            </>
          )}

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself"
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <Button title="Complete Sign Up" onPress={handleSubmit} />
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  readOnlyInput: {
    backgroundColor: "#f5f5f5",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginTop: 16,
  },
});
