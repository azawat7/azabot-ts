import { SessionUser } from "@/app/lib/types";

interface UserProfileProps {
  user: SessionUser;
}

export function UserProfile({ user }: UserProfileProps) {
  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

  return (
    <div className="flex items-center gap-4">
      <img
        src={avatarUrl}
        alt={`${user.username}'s avatar`}
        className="w-10 h-10 rounded-full"
      />
      <div>
        <div>@{user.username}</div>
      </div>
    </div>
  );
}
