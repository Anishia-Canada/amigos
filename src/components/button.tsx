import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant === 'primary' && styles.primaryPressed,
        pressed && variant !== 'primary' && styles.pressed,
        inactive && styles.inactive,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.primaryText : Colors.primary} />
      ) : (
        <Text style={[styles.text, variant === 'primary' ? styles.primaryText : styles.secondaryText]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.primary },
  primaryPressed: { backgroundColor: Colors.primaryPressed },
  secondary: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  link: { minHeight: 48, backgroundColor: 'transparent' },
  pressed: { opacity: 0.6 },
  inactive: { opacity: 0.5 },
  text: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  primaryText: { color: Colors.primaryText },
  secondaryText: { color: Colors.primary },
});
