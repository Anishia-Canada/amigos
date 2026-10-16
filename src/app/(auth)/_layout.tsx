import { Stack } from 'expo-router';

import { Colors } from '@/constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitle: '',
        headerTintColor: Colors.primary,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
