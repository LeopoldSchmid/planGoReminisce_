'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineSpinner } from '@/components/common/LoadingSpinner';

// Base form data type
// Base form type with all possible fields
export type AuthFormData = {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
};

type AuthFormProps = {
  type: 'login' | 'signup';
  schema: z.ZodType<Partial<AuthFormData>>;
  onSubmit: (data: AuthFormData) => Promise<void>;
  loading: boolean;
  error?: string | null;
};

export function AuthForm({ type, schema, onSubmit, loading, error }: AuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(schema as any), // Type assertion needed for zodResolver
    defaultValues: {
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    }
  });

  const handleFormSubmit = async (data: AuthFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {type === 'login' ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription>
            {type === 'login'
              ? 'Enter your email and password to sign in'
              : 'Fill in the form to create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={loading}
                {...register('email' as const)}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {type === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  disabled={loading}
                  {...register('username' as const)}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                {type === 'login' && (
                  <a
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                disabled={loading}
                {...register('password' as const)}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {type === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  disabled={loading}
                  {...register('confirmPassword' as const)}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <InlineSpinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </span>
              ) : type === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {type === 'login' ? (
              <>
                Don't have an account?{' '}
                <a
                  href="/signup"
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </a>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
