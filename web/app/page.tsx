"use client";
import { LoginButton } from "@/app/components/auth/LoginButton";
import { UserProfile } from "@/app/components/auth/UserProfile";
import { LogoutButton } from "@/app/components/auth/LogoutButton";
import { useAuth } from "./hooks/useAuth";
import { Loading } from "./components/ui/Loading";
import { Error } from "./components/ui/Error";

export default function Home({}: {}) {
  const { user, loading, error, refresh } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={refresh} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {user ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <UserProfile user={user} />
              <LogoutButton />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Welcome to azabot
            </h1>
            <LoginButton />
          </div>
        )}
      </div>
    </div>
  );
}
