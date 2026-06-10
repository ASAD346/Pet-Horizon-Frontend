import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="support" />
    </Stack>
  );
}
