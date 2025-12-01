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
    />
  );
}
