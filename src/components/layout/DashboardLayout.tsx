"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/services/authService";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullscreen message="Loading your dashboard..." size="lg" />;
  }

  if (!user) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="min-h-screen bg-brand-subtle">
      <nav className="bg-card-elevated shadow-sm border-b border-brand-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="text-xl font-bold text-brand-primary hover:text-brand-primary transition-colors"
              >
                Plangoreminisce
              </Link>
              {/* Desktop Navigation */}
              <div className="hidden md:ml-10 md:flex md:items-baseline md:space-x-4">
                <Link
                  href="/trips"
                  className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Trips
                </Link>
                <Link
                  href="/profile"
                  className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
            
            {/* Desktop User Menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <span className="text-muted-foreground text-sm">Welcome, {user.email}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>

            {/* Mobile menu button - larger touch target */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted min-h-[44px] min-w-[44px]"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile menu - improved touch targets */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border">
                <Link
                  href="/trips"
                  className="text-foreground hover:text-primary block px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Trips
                </Link>
                <Link
                  href="/profile"
                  className="text-foreground hover:text-primary block px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <div className="border-t border-border pt-4 pb-3 mt-4">
                  <div className="px-4 py-2">
                    <p className="text-sm text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                  </div>
                  <div className="px-4 pt-2">
                    <Button 
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }} 
                      variant="outline" 
                      className="w-full min-h-[44px]"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}