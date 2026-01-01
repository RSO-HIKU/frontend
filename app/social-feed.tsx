import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { feedApi, Post } from "./lib/feedApi";

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = 3; // Replace with actual current user ID from auth context

  useEffect(() => {
    loadFollowedPosts();
  }, []);

  const loadFollowedPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedApi.getFollowedPosts(currentUserId);
      console.log("Fetched followed posts:", data);
      setPosts(data);
    } catch (err) {
      setError("Failed to load posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.post}>
          <Text style={styles.user}>{item.username}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.text}>{item.content}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts from followed users yet</Text>
        </View>
      }
      refreshing={loading}
      onRefresh={loadFollowedPosts}
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
  title: { fontWeight: "600", marginBottom: 4, fontSize: 16 },
  text: { marginBottom: 8 },
  date: { color: "#999", fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },
  errorText: { color: "#FF3B30", fontSize: 16, textAlign: "center" },
});