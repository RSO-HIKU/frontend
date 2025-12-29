import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      // style the native header shown by expo-router / react-navigation
      screenOptions={{
        headerStyle: { backgroundColor: "#b6c8ba" },
        headerTitleAlign: "center",
        headerTitle: "Welcome to HIKU!",
        headerTitleStyle: { fontWeight: "800", fontSize: 18 },
      }}
    >
      {/* Hide header on the index screen to avoid duplicate titles with in-page header */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="social-feed" options={{ title: "Social Feed" }} />
      <Stack.Screen name="user-profile" options={{ title: "User Profile" }} />
    </Stack>
  );
}
