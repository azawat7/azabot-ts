"use client";
import { LoginButton } from "@/app/components/auth/LoginButton";
import { UserProfile } from "@/app/components/auth/UserProfile";
import { LogoutButton } from "@/app/components/auth/LogoutButton";
import { useAuth } from "./hooks/useAuth";

export default function Home({}: {}) {
  const { user } = useAuth();

  return (
    <>
      {user ? (
        <div>
          <UserProfile user={user} />
          <LogoutButton />
        </div>
      ) : (
        <LoginButton />
      )}
    </>
  );
}
