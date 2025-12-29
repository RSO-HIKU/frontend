import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { fetchUserProfile, UserProfileDto } from "./lib/userApi"; // adjust path

export default function UserProfile() {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = "1"; // Replace with dynamic user ID as needed

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchUserProfile(userId );
        setUser(data);
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>User data not available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://picsum.photos/200" }}
        style={styles.avatar}
      />
        <Text style={styles.name}>{user.username}</Text>
        {user.email && <Text style={styles.info}>{user.email}</Text>}
        

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  info: { fontSize: 16, color: "#555" },
});
