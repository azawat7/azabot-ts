export function LoginButton() {
  return (
    <a
      href="/api/auth/login"
      className="p-2 bg-indigo-400 text-white cursor-pointer rounded-md"
    >
      Login with Discord
    </a>
  );
}
