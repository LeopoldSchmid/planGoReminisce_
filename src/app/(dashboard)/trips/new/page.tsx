import { CreateTripForm } from "@/components/common/CreateTripForm";
import React from "react";

export default function NewTripPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-semibold mb-8">Create a New Trip</h1>
        <CreateTripForm />
      </div>
    </div>
  );
}
