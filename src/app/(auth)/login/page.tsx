'use client';


import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AuthForm, type AuthFormData } from '@/components/common/AuthForm';
import { signIn } from '@/services/authService';

const formSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  async function handleLogin(formData: Pick<AuthFormData, 'email' | 'password'>) {
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', formData.email);
      const { data, error: signInError } = await signIn({
        email: formData.email,
        password: formData.password
      });

      console.log('Login response:', { data, signInError });

      if (signInError) {
        console.error('Login failed:', signInError);
        setError(signInError.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        console.error('No user data in response');
        setError('No user data received');
        setLoading(false);
        return;
      }

      // Redirect to the specified redirect URL or dashboard
      router.push(redirectTo);

    } catch (e: any) {
      console.error('Login error:', e);
      setError(e.message || 'An unexpected error occurred. Please try again.');
    } finally {
      if (!error) setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <AuthForm
            type="login"
            schema={formSchema as any}
            onSubmit={handleLogin}
            loading={loading}
            error={null} // We're handling errors above now
          />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Having trouble signing in?
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
