import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from "react-native";
import { fetchUserProfile, UserProfileDto, followUser, unfollowUser, fetchFollowing } from "./lib/userApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { Ionicons } from '@expo/vector-icons';

export default function UserProfile() {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(false);
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const { getUserId } = useAuth();
  const currentUserId = getUserId();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchUserProfile(userId);
        setUser(data);
        
        // Check if current user is following this user
        if (currentUserId && currentUserId !== userId) {
          setCheckingFollow(true);
          const followingList = await fetchFollowing(currentUserId);
          setIsFollowing(followingList.some((u) => u.id === userId));
          setCheckingFollow(false);
        }
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId, currentUserId]);

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      Alert.alert("Error", "You must be logged in to follow users");
      return;
    }
    
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, userId);
        setIsFollowing(false);
        Alert.alert("Success", "Unfollowed user");
      } else {
        await followUser(currentUserId, userId);
        setIsFollowing(true);
        Alert.alert("Success", "Now following user");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
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

  const isOwnProfile = currentUserId === userId;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#007AFF" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <Image
        source={{ uri: "https://picsum.photos/200" }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{user.username}</Text>
      {isOwnProfile && user.email && <Text style={styles.info}>{user.email}</Text>}
      {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      
      {!isOwnProfile && currentUserId && (
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.unfollowButton]}
          onPress={handleFollowToggle}
          disabled={checkingFollow}
        >
          {checkingFollow ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name={isFollowing ? "person-remove" : "person-add"} size={18} color="#fff" />
              <Text style={styles.followButtonText}>
                {isFollowing ? "Unfollow" : "Follow"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  name: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  info: { fontSize: 16, color: "#555", marginBottom: 4 },
  bio: { fontSize: 16, color: "#333", marginTop: 12, marginBottom: 20, textAlign: "center", paddingHorizontal: 20 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 16,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    minWidth: 140,
  },
  unfollowButton: {
    backgroundColor: "#FF3B30",
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
});
