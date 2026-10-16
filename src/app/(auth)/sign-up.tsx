import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { FormScreen } from '@/components/form-screen';
import { TextField } from '@/components/text-field';
import { Colors } from '@/constants/colors';
import {
  friendlyAuthError,
  isUserRole,
  signUp,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
  type UserRole,
} from '@/lib/auth';

type Field = 'fullName' | 'phone' | 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const ROLE_LABELS: Record<UserRole, string> = {
  homeowner: 'I need yard help',
  amigo: 'I’m an Amigo',
};

export default function SignUpScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<UserRole>(isUserRole(params.role) ? params.role : 'homeowner');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const errors: FieldErrors = {};
    const nameError = validateFullName(fullName);
    const phoneError = validatePhone(phone);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (nameError) errors.fullName = nameError;
    if (phoneError) errors.phone = phoneError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    setFormError(null);
    setNotice(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const signedIn = await signUp({ email, password, fullName, phone, role });
      if (signedIn) {
        // The root layout routes to the role's tabs once the profile loads; keep the spinner until then.
        return;
      }
      setNotice('Account created. Check your email to confirm it, then log in.');
    } catch (error) {
      setFormError(friendlyAuthError(error));
    }
    setSubmitting(false);
  }

  return (
    <FormScreen
      title="Create your account"
      subtitle={role === 'amigo' ? 'Earn by helping neighbours with yard work.' : 'Get reliable help with your yard.'}
      error={formError}>
      <View style={styles.roleRow} accessibilityRole="radiogroup">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => {
          const selected = r === role;
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setRole(r)}
              style={[styles.roleOption, selected && styles.roleOptionSelected]}>
              <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{ROLE_LABELS[r]}</Text>
            </Pressable>
          );
        })}
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <TextField
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        error={fieldErrors.fullName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TextField
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        error={fieldErrors.phone}
        placeholder="519 555 0123"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        placeholder="At least 8 characters"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={handleSubmit}
      />

      <Button title="Sign up" onPress={handleSubmit} loading={submitting} />
      <Button
        title="Already have an account? Log in"
        variant="link"
        onPress={() => router.replace('/sign-in')}
        disabled={submitting}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  roleRow: { flexDirection: 'row', gap: 10 },
  roleOption: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  roleOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  roleText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  roleTextSelected: { color: Colors.primary },
  notice: { fontSize: 16, color: Colors.primary, lineHeight: 22 },
});
