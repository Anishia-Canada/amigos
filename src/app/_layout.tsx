import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Button } from '@/components/button';
import { CenteredMessage } from '@/components/centered-message';
import { AuthProvider, useAuth } from '@/lib/auth-context';

// Keep the splash up until we know who the user is, so the wrong screen never flashes.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, profile, loading, profileError, retryProfile, signOut } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  if (profileError) {
    return (
      <CenteredMessage title="Couldn’t load your account" message={profileError}>
        <Button title="Try again" onPress={retryProfile} />
        <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
      </CenteredMessage>
    );
  }

  const role = profile?.role;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'homeowner'}>
        <Stack.Screen name="(homeowner)" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'amigo'}>
        <Stack.Screen name="(amigo)" />
      </Stack.Protected>
    </Stack>
  );
}
