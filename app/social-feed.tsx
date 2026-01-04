import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { feedApi, Post } from "./lib/feedApi";

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const router = useRouter();
  const currentUserId = 1; // Replace with actual current user ID from auth context

  useEffect(() => {
    loadFollowedPosts();
  }, []);

  useEffect(() => {
    posts.forEach((p) => {
      if (p.postimageurl && !imageAspectRatios[p.postimageurl]) {
        Image.getSize(
          p.postimageurl,
          (width, height) =>
            setImageAspectRatios((prev) => ({ ...prev, [p.postimageurl]: width / height })),
          (err) => console.warn("Failed to get image size:", err)
        );
      }
    });
  }, [posts]);
  
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
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Following</Text>
          <Text style={styles.headerDescription}>Posts from people you follow</Text>
        </View>
        <TouchableOpacity 
          style={styles.myPostsButton}
          onPress={() => router.push("/my-posts")}
        >
          <Text style={styles.myPostsButtonText}>My Posts</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.container}
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text style={styles.user}>{item.username}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.postimageurl && (
              <Image
                source={{ uri: item.postimageurl }}
                style={[
                  styles.postImage,
                  { aspectRatio: imageAspectRatios[item.postimageurl] ?? 16 / 9 },
                ]}
                resizeMode="contain"
              />
            )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  headerContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  headerDescription: { fontSize: 14, color: "#666" },
  myPostsButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12
  },
  myPostsButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  container: { flex: 1, padding: 12 },
  post: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    borderRadius: 6,
    marginVertical: 8,
  },
  user: { fontWeight: "700", marginBottom: 4 },
  title: { fontWeight: "600", marginBottom: 4, fontSize: 16 },
  text: { marginBottom: 8 },
  date: { color: "#999", fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },
  errorText: { color: "#FF3B30", fontSize: 16, textAlign: "center" },
});