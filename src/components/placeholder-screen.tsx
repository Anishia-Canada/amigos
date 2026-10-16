import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/button';
import { CenteredMessage } from '@/components/centered-message';
import { friendlyAuthError } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';

type Props = {
  title: string;
  message: string;
  showSignOut?: boolean;
};

export function PlaceholderScreen({ title, message, showSignOut = false }: Props) {
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Couldn’t sign out', friendlyAuthError(error));
      setSigningOut(false);
    }
  }

  const greeting = showSignOut && profile ? `Signed in as ${profile.full_name}.\n\n` : '';

  return (
    <CenteredMessage title={title} message={`${greeting}${message}`}>
      {showSignOut ? (
        <Button title="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
      ) : null}
    </CenteredMessage>
  );
}
