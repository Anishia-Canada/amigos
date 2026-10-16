import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Colors } from '@/constants/colors';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Amigos</Text>
        <Text style={styles.tagline}>Yard help from your neighbours in Doon South.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="I need yard help"
          onPress={() => router.push({ pathname: '/sign-up', params: { role: 'homeowner' } })}
        />
        <Button
          title="I want to earn as an Amigo"
          variant="secondary"
          onPress={() => router.push({ pathname: '/sign-up', params: { role: 'amigo' } })}
        />
        <Button
          title="Already have an account? Log in"
          variant="link"
          onPress={() => router.push('/sign-in')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, padding: 24 },
  hero: { flex: 1, justifyContent: 'center', gap: 12 },
  brand: { fontSize: 44, fontWeight: '800', color: Colors.primary },
  tagline: { fontSize: 20, color: Colors.text, lineHeight: 28 },
  actions: { gap: 14, paddingBottom: 12 },
});
