"use client";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 bg-red-500 text-white cursor-pointer rounded-md"
    >
      Logout
    </button>
  );
}
