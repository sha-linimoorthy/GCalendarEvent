"use client"
import { useState } from 'react';

export default function Home() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const signIn = async () => {
    window.location.href = 'http://localhost:8000/outlook/auth/login';
  };

  const signOut = async () => {
    await fetch('http://localhost:8000/outlook/auth/login');
    setUser(null);
  };

  return (
    <div>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold">Teams Meeting Creator</h1>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span>{user.name}</span>
                <button className="bg-red-500 px-4 py-2 rounded" onClick={signOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="bg-blue-500 px-4 py-2 rounded" onClick={signIn}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto mt-8 p-4">
        <h2 className="text-2xl font-bold">Welcome to Teams Meeting Creator</h2>
        <p className="mt-4">
          {user
            ? `Hello, ${user.name}. You can create Teams meetings from here.`
            : 'Sign in to create Teams meetings.'}
        </p>
      </main>
    </div>
  );
}
