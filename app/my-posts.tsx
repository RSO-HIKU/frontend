import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Image } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { feedApi, Post } from "./lib/feedApi";
import { useAuth } from "./context/AuthContext";
import { fetchUserProfile } from "./lib/userApi";

export default function MyPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const router = useRouter();
  const { getUserId } = useAuth();
  const currentUserId = getUserId();
  const [currentUsername, setCurrentUsername] = useState<string>("user");
  
  useEffect(() => {
    if (currentUserId) {
      fetchUserProfile(currentUserId).then(user => setCurrentUsername(user.username)).catch(console.error);
    }
    loadMyPosts();
  }, [currentUserId]);

  useEffect(() => {
    // compute aspect ratios for loaded posts
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

  useEffect(() => {
    if (selectedImage && !imageAspectRatios[selectedImage]) {
      Image.getSize(
        selectedImage,
        (width, height) =>
          setImageAspectRatios((prev) => ({ ...prev, [selectedImage]: width / height })),
        (err) => console.warn("Failed to get selected image size:", err)
      );
    }
  }, [selectedImage]);

  const loadMyPosts = async () => {
    if (!currentUserId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUserId) {
      Alert.alert("User not authenticated");
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert("Title and content are required.");
      return;
    }
    try {
      setCreating(true);
      let imageUrl = "";
      if (selectedImage) {
        imageUrl = await feedApi.uploadImage(selectedImage);
    
      }
      await feedApi.createPost({ 
        userId: currentUserId, 
        username: currentUsername,
        title: newTitle, 
        content: newContent,
        postimageurl: imageUrl
      });
      setModalVisible(false);
      setNewTitle("");
      setNewContent("");
      setSelectedImage(null);
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
            <TouchableOpacity 
              style={styles.imagePicker}
              onPress={pickImage}
            >
              <Text style={styles.imagePickerText}>
                {selectedImage ? "✓ Image Selected" : "Pick an Image"}
              </Text>
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={[
                  styles.selectedImagePreview,
                  { aspectRatio: imageAspectRatios[selectedImage] ?? 4 / 3 },
                ]}
                resizeMode="contain"
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedImage(null);
                }}
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
  postImage: {
    width: "100%",
    borderRadius: 6,
    marginVertical: 8,
    // height removed to allow aspectRatio to control rendered height
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
  imagePicker: {
    backgroundColor: "#E8F0FF",
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  imagePickerText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 14,
  },
  selectedImagePreview: {
    width: "100%",
    borderRadius: 8,
    marginBottom: 12,
    // height removed so aspectRatio/contain shows whole image
  },
});