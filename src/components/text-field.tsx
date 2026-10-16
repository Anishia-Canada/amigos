import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/colors';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, ...inputProps }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 17,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  inputError: { borderColor: Colors.danger },
  error: { fontSize: 14, color: Colors.danger },
});
