import { View, Text, StyleSheet, FlatList, Image } from "react-native";

const MOCK_POSTS = [
  {
    id: "1",
    user: "Marko",
    text: "Reached Triglav today 🏔️",
    image: "https://picsum.photos/400/250",
  },
  {
    id: "2",
    user: "Ana",
    text: "Beautiful hike in the Alps",
    image: "https://picsum.photos/401/250",
  },
];

export default function SocialFeed() {
  return (
    <FlatList
      style={styles.container}
      data={MOCK_POSTS}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.post}>
          <Text style={styles.user}>{item.user}</Text>
          <Text style={styles.text}>{item.text}</Text>
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.image} />
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
  post: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  user: { fontWeight: "700", marginBottom: 4 },
  text: { marginBottom: 8 },
  image: { width: "100%", height: 200, borderRadius: 6 },
});
