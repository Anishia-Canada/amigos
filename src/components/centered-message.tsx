import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';

type Props = {
  title?: string;
  message?: string;
  loading?: boolean;
  children?: ReactNode;
};

/** Full-screen centered message, used for loading, empty and error states. */
export function CenteredMessage({ title, message, loading = false, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="large" color={Colors.primary} /> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {children ? <View style={styles.actions}>{children}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  message: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  actions: { marginTop: 12, gap: 12 },
});
