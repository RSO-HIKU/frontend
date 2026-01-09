import React, { useEffect } from "react";
import { View, Button, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "./context/AuthContext";

export default function Login() {
  const { ready, authenticated, needsProfile, login, register } = useAuth();

  useEffect(() => {
    if (!ready) return;
    
    console.log("[Login] Navigation check:", { authenticated, needsProfile });
    
    if (authenticated) {
      // Check localStorage for registration flag (in case state was lost on remount)
      const registrationFlag = window.localStorage.getItem('keycloak_just_registered') === 'true';
      console.log("[Login] Registration flag from localStorage:", registrationFlag);
      
      if (needsProfile) {
        // User just registered (new account)
        console.log("[Login] User needs profile - going to finish-signup");
        window.localStorage.removeItem('keycloak_just_registered');
        router.replace("/finish-signup");
      } else {
        // User has complete profile - go to home
        console.log("[Login] User has profile - going to home");
        window.localStorage.removeItem('keycloak_just_registered');
        router.replace("/");
      }
    }
  }, [ready, authenticated, needsProfile]);

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
