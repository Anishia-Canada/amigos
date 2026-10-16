import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth-context';

/** Entry route: sends each user to the right place. The root layout's guards enforce it. */
export default function Index() {
  const { session, profile } = useAuth();

  if (!session || !profile) return <Redirect href="/welcome" />;
  return <Redirect href={profile.role === 'amigo' ? '/offers' : '/home'} />;
}
