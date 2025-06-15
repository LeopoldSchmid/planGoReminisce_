"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSpinnerProps {
  message?: string;
  fullscreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ 
  message = "Loading...", 
  fullscreen = false,
  size = "md" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const spinner = (
    <div className="text-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${sizeClasses[size]}`} />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="py-8">
        {spinner}
      </CardContent>
    </Card>
  );
}

// Simple inline spinner for buttons and smaller components
export function InlineSpinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6"
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]}`} />
  );
}