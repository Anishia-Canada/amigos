import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';

type Props = {
  title: string;
  subtitle?: string;
  /** Form-level error shown as a banner above the fields. */
  error?: string | null;
  children: ReactNode;
};

/** Scrollable, keyboard-aware layout for auth forms. */
export function FormScreen({ title, subtitle, error, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {error ? (
            <View style={styles.banner} accessibilityRole="alert">
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: 24, gap: 18, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 16, color: Colors.textMuted, lineHeight: 22 },
  banner: {
    backgroundColor: Colors.dangerBackground,
    borderRadius: 10,
    padding: 14,
  },
  bannerText: { color: Colors.danger, fontSize: 15, lineHeight: 21 },
});
