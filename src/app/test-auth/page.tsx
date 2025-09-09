"use client"

import { useUser } from "@clerk/nextjs";

export default function TestAuth() {
  const { user } = useUser();
  // TODO: Replace with your user system integration
  const convexUser = null;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Auth Integration Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Clerk User:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(user ? {
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              name: `${user.firstName} ${user.lastName}`.trim(),
              imageUrl: user.imageUrl
            } : null, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Database User:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(convexUser || null, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Status:</h2>
          <p className={`text-sm ${user ? 'text-green-600' : 'text-red-600'}`}>
            {user ? 
              '✅ Clerk authentication working!' : 
              '❌ User not authenticated'
            }
          </p>
        </div>
      </div>
    </div>
  );
}