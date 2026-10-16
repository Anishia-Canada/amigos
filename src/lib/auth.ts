import { isAuthError } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { supabase } from './supabase';

export type UserRole = Database['public']['Enums']['user_role'];
export type Profile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'role' | 'full_name' | 'phone'
>;

export function isUserRole(value: unknown): value is UserRole {
  return value === 'homeowner' || value === 'amigo';
}

// ---------------------------------------------------------------------------
// Validation (returns an error message, or null when valid)
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateFullName(value: string): string | null {
  return value.trim().length >= 2 ? null : 'Enter your full name.';
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Enter your email.';
  return EMAIL_RE.test(value.trim()) ? null : 'That email doesn’t look right.';
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Enter a password.';
  return value.length >= 8 ? null : 'Use at least 8 characters.';
}

/** Canadian/US number → E.164 (+1XXXXXXXXXX), or null if invalid. */
export function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits.length === 10 ? `+1${digits}` : null;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return 'Enter your phone number.';
  return normalizePhone(value) ? null : 'Enter a 10-digit phone number, e.g. 519 555 0123.';
}

// ---------------------------------------------------------------------------
// Auth calls
// ---------------------------------------------------------------------------
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
};

/** Returns true when a session was created (email confirmation off). */
export async function signUp(input: SignUpInput): Promise<boolean> {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error('Enter a 10-digit phone number.');

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      // Read by the handle_new_user trigger to create the profiles row.
      data: { role: input.role, full_name: input.fullName.trim(), phone },
    },
  });
  if (error) throw error;
  return data.session !== null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export function friendlyAuthError(error: unknown): string {
  if (isAuthError(error)) {
    if (error.name === 'AuthRetryableFetchError') {
      return 'Can’t reach the server. Check your internet connection and try again.';
    }
    switch (error.code) {
      case 'invalid_credentials':
        return 'Email or password is incorrect.';
      case 'user_already_exists':
      case 'email_exists':
        return 'An account with this email already exists. Try logging in instead.';
      case 'email_address_invalid':
        return 'That email address isn’t accepted. Try a different one.';
      case 'weak_password':
        return 'That password is too weak. Try a longer one.';
      case 'email_not_confirmed':
        return 'Please confirm your email first, then log in.';
      case 'over_request_rate_limit':
      case 'over_email_send_rate_limit':
        return 'Too many attempts. Wait a minute and try again.';
      case 'unexpected_failure':
        return 'We couldn’t create your profile. Please try again.';
    }
    if (/database error saving new user/i.test(error.message)) {
      return 'We couldn’t create your profile. Please try again.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    if (/network request failed|fetch/i.test(error.message)) {
      return 'Can’t reach the server. Check your internet connection and try again.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
