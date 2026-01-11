import { use, useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, ActivityIndicator, Button, ScrollView, Modal, FlatList, TouchableOpacity } from "react-native";
import { 
  fetchUserProfile, 
  updateUserProfile, 
  fetchFollowers, 
  fetchFollowing,
  searchUsers,
  followUser,
  unfollowUser,
  UserProfileDto 
} from "./lib/userApi";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "./context/AuthContext";
import { useRouter } from "expo-router";

export default function MyUserProfile() {
  const { getUserId, getToken } = useAuth();
  const userId = getUserId();
  const router = useRouter();
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [view, setView] = useState<"profile" | "followers" | "following">("profile");
  const [followers, setFollowers] = useState<UserProfileDto[]>([]);
  const [following, setFollowing] = useState<UserProfileDto[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfileDto[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (userId === null) {
      console.warn("User ID is null");
      
      // not authenticated — redirect or show message
      return;
    }else {
      console.log("Fetching profile for userId:", userId);
    }
    const loadUser = async () => {
      try {
        const data = await fetchUserProfile(userId, getToken);
        setUser(data);
        setBio(data.bio || "");
        setUsername(data.username);
        setEmail(data.email || "");
        const followingData = await fetchFollowing(userId, getToken);
      setFollowing(followingData);
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  const saveChanges = async () => {
    if (!user) return;
    try {
      if (userId === null) {
        alert("User not authenticated");
        return;
      }
      const updated = await updateUserProfile(userId, { username, email, bio }, getToken);
      setUser(updated);
      setEditing(false);
      alert("Profile updated!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const showFollowers = async () => {
    setView("followers");
    setListLoading(true);
    try {
            if (userId === null) {
        alert("User not authenticated");
        return;
      }
      const data = await fetchFollowers(userId, getToken);
      setFollowers(data);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setListLoading(false);
    }
  };

  const showFollowing = async () => {
    setView("following");
    setListLoading(true);
    try {
            if (userId === null) {
        alert("User not authenticated");
        return;
      }
      const data = await fetchFollowing(userId, getToken);
      setFollowing(data);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setListLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a username");
      return;
    }
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery, getToken);
      setSearchResults(results);
    } catch (err: any) {
      alert(`Search error: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

const handleFollowUser = async (targetUserId: string) => {
  try {
          if (userId === null) {
        alert("User not authenticated");
        return;
      }
    await followUser(userId, targetUserId, getToken);
    alert("Now following!");
    setSearchResults(searchResults.filter((u) => u.id !== targetUserId));
    setSearchQuery("");
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
};

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

  // Profile view
  if (view === "profile") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>My Profile</Text>
        <Image source={{ uri: "https://picsum.photos/200" }} style={styles.avatar} />
        {editing ? (
          <>
            <TextInput style={[styles.input, styles.disabledInput]} value={username} editable={false} placeholder="Username" />
            <TextInput style={[styles.input, styles.disabledInput]} value={email} editable={false} placeholder="Email" />
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.name}>{user.username}</Text>
            {user.email && <Text style={styles.info}>{user.email}</Text>}
            {user.bio && <Text style={styles.info}>{user.bio}</Text>}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Ionicons name="pencil" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sectionButton} onPress={showFollowers}>
                <Ionicons name="people" size={18} color="#fff" />
                <Text style={styles.sectionButtonText}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sectionButton} onPress={showFollowing}>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.sectionButtonText}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sectionButton} onPress={() => setSearchModalVisible(true)}>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.sectionButtonText}>Search Users</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Search Modal */}
        <Modal visible={searchModalVisible} animationType="slide" onRequestClose={() => setSearchModalVisible(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Search Users</Text>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter username"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
                <Text style={styles.searchButtonText}>{searching ? "..." : "Search"}</Text>
              </TouchableOpacity>
            </View>

            {searching ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
<FlatList
  data={searchResults}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const isFollowing = following.some((f) => f.id === item.id);
    return (
      <View style={styles.searchResultItem}>
        <View style={styles.resultInfo}>
          <Text style={styles.resultUsername}>{item.username}</Text>
          {item.bio && <Text style={styles.resultBio}>{item.bio}</Text>}
        </View>
        {isFollowing ? (
          <TouchableOpacity style={[styles.followButton, { backgroundColor: "#ccc" }]} disabled>
            <Text style={[styles.followButtonText, { color: "#888" }]}>Already Following</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.followButton}
            onPress={() => handleFollowUser(item.id)}
          >
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }}
  ListEmptyComponent={
    <Text style={styles.emptyText}>
      {searchQuery ? "No users found" : "Search to find users"}
    </Text>
  }
/>
            )}

            <View style={styles.closeButtonContainer}>
              <Button title="Close" onPress={() => setSearchModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // Followers or Following list view
  const listTitle = view === "followers" ? "Followers" : "Following";
  const list = view === "followers" ? followers : following;

  return (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.pageTitle}>{listTitle}</Text>
    <TouchableOpacity style={styles.backButton} onPress={() => setView("profile")}>
      <Ionicons name="arrow-back" size={20} color="#007AFF" />
      <Text style={styles.backButtonText}>Back to Profile</Text>
    </TouchableOpacity>
    {listLoading ? (
      <ActivityIndicator style={{ marginTop: 20 }} />
    ) : (
      list.map((u) => (
        <View key={u.id} style={styles.listItem}>
          <TouchableOpacity onPress={() => router.push({ pathname: "/user-profile", params: { userId: u.id } })}>
            <Text style={styles.clickableName}>{u.username}</Text>
          </TouchableOpacity>
          {view === "following" ? (
            <TouchableOpacity
              style={styles.unfollowButton}
              accessibilityLabel={`Unfollow ${u.username}`}
              onPress={async () => {
                try {
                        if (userId === null) {
        alert("User not authenticated");
        return;
      }
                  await unfollowUser(userId, u.id, getToken);
                  setFollowing(following.filter((f) => f.id !== u.id));
                } catch (err: any) {
                  alert("Failed to unfollow");
                }
              }}
            >
              <Ionicons name="person-remove" size={16} color="#fff" />
              <Text style={styles.unfollowButtonText}>Unfollow</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.unfollowButton}
              accessibilityLabel={`Remove follower ${u.username}`}
              onPress={async () => {
                try {
                        if (userId === null) {
        alert("User not authenticated");
        return;
      }
                  await unfollowUser(u.id, userId, getToken);
                  setFollowers(followers.filter((f) => f.id !== u.id));
                } catch (err: any) {
                  alert("Failed to remove follower");
                }
              }}
            >
              <Ionicons name="person-remove" size={16} color="#fff" />
              <Text style={styles.unfollowButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))
    )}
  </ScrollView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 40, backgroundColor: "#fff" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  clickableName: { fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#007AFF", textDecorationLine: "underline" },
  info: { fontSize: 16, color: "#555" },
  buttonContainer: { marginVertical: 8, borderRadius: 8, overflow: "hidden" },
  bioInput: { height: 100 },
  input: { width: 250, height: 40, borderColor: "#ccc", borderWidth: 1, borderRadius: 8, marginBottom: 10, paddingHorizontal: 8 },
  disabledInput: { backgroundColor: "#f0f0f0", color: "#999" },
  listItem: { padding: 12, borderBottomWidth: 1, borderColor: "#eee", width: "100%", alignItems: "center" },
  
  // Modal styles
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#fff", paddingTop: 40 },
  modalTitle: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  searchBar: { flexDirection: "row", marginBottom: 20, gap: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, height: 40 },
  searchButton: { backgroundColor: "#007AFF", paddingHorizontal: 20, borderRadius: 8, justifyContent: "center" },
  searchButtonText: { color: "#fff", fontWeight: "600" },
  
  searchResultItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  resultInfo: { flex: 1 },
  resultUsername: { fontSize: 16, fontWeight: "600" },
  resultBio: { fontSize: 14, color: "#666", marginTop: 4 },
  
  followButton: { backgroundColor: "#007AFF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  followButtonText: { color: "#fff", fontWeight: "600" },
  
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#007AFF",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    marginVertical: 20,
    width: "100%",
    maxWidth: 500,
    marginHorizontal: "auto",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
  },
  editButtonText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 16 },
  sectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
  },
  sectionButtonText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 16 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34C759",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  saveButtonText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButtonText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 16,
  },
  unfollowButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  unfollowButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },

  emptyText: { textAlign: "center", marginTop: 20, color: "#999" },
  closeButtonContainer: { marginTop: 20, borderRadius: 8, overflow: "hidden" },
});