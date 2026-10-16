import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { FormScreen } from '@/components/form-screen';
import { TextField } from '@/components/text-field';
import { friendlyAuthError, signIn, validateEmail } from '@/lib/auth';

type FieldErrors = { email?: string; password?: string };

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const errors: FieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      // The root layout routes to the role's tabs once the profile loads; keep the spinner until then.
      return;
    } catch (error) {
      setFormError(friendlyAuthError(error));
    }
    setSubmitting(false);
  }

  return (
    <FormScreen title="Welcome back" subtitle="Log in to your Amigos account." error={formError}>
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
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={handleSubmit}
      />

      <Button title="Log in" onPress={handleSubmit} loading={submitting} />
      <Button
        title="New here? Create an account"
        variant="link"
        onPress={() => router.replace('/welcome')}
        disabled={submitting}
      />
    </FormScreen>
  );
}
