import { View, Text, StyleSheet, Image } from "react-native";

export default function UserProfile() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://picsum.photos/200" }}
        style={styles.avatar}
      />
      <Text style={styles.name}>Janez Novak</Text>
      <Text style={styles.info}>Total hikes: 27</Text>
      <Text style={styles.info}>Achievements: 5</Text>
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
