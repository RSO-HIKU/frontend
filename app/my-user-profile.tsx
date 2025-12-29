import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, ActivityIndicator, Alert, Button } from "react-native";
import { fetchUserProfile, updateUserProfile, UserProfileDto } from "./lib/userApi";

export default function MyUserProfile() {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | undefined>(undefined);

  const userId = "2";

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchUserProfile(userId);
        setUser(data);
        setBio(data.bio || "");
        setUsername(data.username);
        setEmail(data.email || "");
        setAge(data.age);
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const saveChanges = async () => {
    if (!user) return;
    try {
      const updated = await updateUserProfile(userId, { username, email, age ,bio});
      setUser(updated);
      setEditing(false);
      Alert.alert("Success", "Profile updated!");
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

  return (
    <View style={styles.container}>
      <Image source={{ uri: "https://picsum.photos/200" }} style={styles.avatar} />
      {editing ? (
        <>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
          <TextInput
            style={styles.input}
            value={age !== undefined ? age.toString() : ""}
            onChangeText={(text) => setAge(Number(text))}
            placeholder="Age"
            keyboardType="numeric"
          />
          <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Bio"
          multiline={true}
          numberOfLines={4} // adjust for height
          textAlignVertical="top" // keeps text at the top for Android
        />
          <View style={styles.buttonContainer}>
                <Button title="Save" onPress={saveChanges} />

          </View>
          <View style={styles.buttonContainer}>
                    <Button title="Cancel" onPress={() => setEditing(false)} />

          </View>
        </>
      ) : (
        <>
          <Text style={styles.name}>{user.username}</Text>
          {user.email && <Text style={styles.info}>{user.email}</Text>}
          {user.age !== undefined && <Text style={styles.info}>Age: {user.age}</Text>}
          {user.bio && <Text style={styles.info}>{user.bio}</Text>}
         <View style={styles.buttonContainer}>
            <Button title="Edit" onPress={() => setEditing(true)} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 40, backgroundColor: "#fff" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  info: { fontSize: 16, color: "#555" },
   buttonContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden', // needed if you want rounded corners on web
  },
    bioInput: {
    height: 100, // bigger height for bio
  },
  input: { width: 250, height: 40, borderColor: "#ccc", borderWidth: 1, borderRadius: 8, marginBottom: 10, paddingHorizontal: 8 },
});
