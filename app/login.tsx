import React, { useEffect } from "react";
import { View, Button, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "./context/AuthContext";

export default function Login() {
  const { ready, authenticated, login, register } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (authenticated) router.replace("/"); // already signed in
  }, [ready, authenticated]);

  if (!ready) {
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Welcome to HIKU</Text>
      <Text>Please sign in or create an account to continue.</Text>

      <Button title="Sign in with Keycloak" onPress={() => login()} />
      <Button title="Create account" onPress={() => register()} />
    </View>
  );
}
