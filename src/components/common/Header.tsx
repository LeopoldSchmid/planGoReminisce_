'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Header() {
    const { user, signOut, isLoading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <header className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            Plangoreminisce
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {isLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : user ? (
                            <>
                                <span className="text-sm text-gray-700">
                                    Logged in as: <span className="font-medium">{user.email}</span>
                                </span>
                                <Button variant="outline" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline">Login</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
} 