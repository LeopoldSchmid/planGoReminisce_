import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to Plangoreminisce</CardTitle>
          <CardDescription>
            Your collaborative trip planning starts here. Please log in or sign up to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="list-disc pl-4">
            <li>
              <Link href="/login" className="text-blue-600 underline">Login</Link>
            </li>
            <li>
              <Link href="/signup" className="text-blue-600 underline">Sign Up</Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-blue-600 underline">Go to Dashboard</Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
