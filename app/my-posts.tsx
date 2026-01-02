import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { feedApi, Post } from "./lib/feedApi";

export default function MyPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const currentUserId = 3; // Replace with actual current user ID from auth context
    const currentUsername = "janez"; // Replace with actual current username from auth context
  useEffect(() => {
    loadMyPosts();
  }, []);

  const loadMyPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedApi.getMyPosts(currentUserId);
      setPosts(data);
    } catch (err) {
      setError("Failed to load your posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert("Title and content are required.");
      return;
    }
    try {
      setCreating(true);
      await feedApi.createPost({ userId: currentUserId, username:currentUsername
        , title: newTitle, content: newContent });
      setModalVisible(false);
      setNewTitle("");
      setNewContent("");
      loadMyPosts();
    } catch (err) {
     alert("Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
  if (confirm("Are you sure you want to delete this post?")) {
    try {
      await feedApi.deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      alert("Failed to delete post");
    }
  }
};

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Posts</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.createButtonText}>+ New Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.container}
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.content}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
              {

                console.log("Deleting post with id:", item.id);
                 handleDeletePost(item.id)
              }
                
               }
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't posted anything yet</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadMyPosts}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Post</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Content"
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#007AFF" }]}
                onPress={handleCreatePost}
                disabled={creating}
              >
                <Text style={{ color: "#fff" }}>{creating ? "Creating..." : "Create"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: { fontSize: 16, color: "#007AFF", marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: "700", flex: 1 },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  createButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  container: { flex: 1, padding: 12 },
  post: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    position: "relative",
  },
  title: { fontWeight: "600", marginBottom: 4, fontSize: 16 },
  text: { marginBottom: 8 },
  date: { color: "#999", fontSize: 12 },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
});