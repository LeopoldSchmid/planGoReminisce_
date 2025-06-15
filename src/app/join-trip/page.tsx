"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { acceptTripInvitation } from "@/services/tripService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function JoinTripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    // If user is authenticated and we have a token, process the invitation
    if (user && token && !isProcessing && !error && !success) {
      handleAcceptInvitation();
    }
  }, [user, token, isProcessing, error, success]);

  const handleAcceptInvitation = async () => {
    if (!token) {
      setError("Invalid invitation link: No token provided.");
      return;
    }

    if (!user) {
      setError("Please log in to accept this invitation.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await acceptTripInvitation(token);
      
      if (result.error) {
        setError(result.error.message || "Failed to accept invitation.");
      } else if (result.tripId) {
        setSuccess("Successfully joined the trip!");
        // Redirect to the trip page after a short delay
        setTimeout(() => {
          router.push(`/trips/${result.tripId}`);
        }, 2000);
      } else {
        setError("Unable to process invitation. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No token provided
  if (!token) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation Link</CardTitle>
            <CardDescription>This invitation link appears to be invalid or incomplete.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/trips">
              <Button className="w-full">Go to My Trips</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not authenticated - prompt to log in
  if (!user) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Trip</CardTitle>
            <CardDescription>
              You've been invited to join a trip! Please log in or sign up to accept this invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Link href={`/login?redirect=${encodeURIComponent(`/join-trip?token=${token}`)}`}>
                <Button className="w-full">Log In</Button>
              </Link>
              <Link href={`/signup?redirect=${encodeURIComponent(`/join-trip?token=${token}`)}`}>
                <Button variant="outline" className="w-full">Sign Up</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing invitation
  if (isProcessing) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Processing your invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to the Trip!</CardTitle>
            <CardDescription>You have successfully joined the trip.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 mb-4">
              You will be redirected to the trip page shortly...
            </p>
            <Link href="/trips">
              <Button className="w-full">Go to My Trips</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unable to Join Trip</CardTitle>
            <CardDescription>There was an issue processing your invitation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col space-y-2">
              <Button onClick={handleAcceptInvitation} disabled={isProcessing}>
                Try Again
              </Button>
              <Link href="/trips">
                <Button variant="outline" className="w-full">Go to My Trips</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Loading invitation...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}