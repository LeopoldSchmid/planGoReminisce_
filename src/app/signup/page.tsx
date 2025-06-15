'use client';

import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AuthForm } from '@/components/common/AuthForm';
import { signUp } from '@/services/authService';
import { AuthFormData } from '@/components/common/AuthForm';

const formSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters long.')
      .max(20, 'Username must be at most 20 characters long.'),
    email: z.string().email('Invalid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const redirectTo = searchParams.get('redirect') || '/';

  async function handleSignUp(formData: AuthFormData) {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data, error: signUpError } = await signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError('Email is already registered.');
      } else if (data?.user && !data.session) {
        setMessage('Sign up successful! Please check your email to confirm your account.');
      } else if (data?.user) {
        router.push(redirectTo);
      } else {
        setError('An unexpected error occurred during sign up.');
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center min-h-screen">
      <AuthForm
        type="signup"
        schema={formSchema as any}
        onSubmit={handleSignUp}
        loading={loading}
        error={error || message}
      />
      </div>
    </div>
  );
}