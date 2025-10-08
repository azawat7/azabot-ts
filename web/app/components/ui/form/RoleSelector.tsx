"use client";

import { useGuildContext } from "../../../contexts/GuildContext";
import { useParams } from "next/navigation";
import { SelectInput } from "./FormField";
import { CachedRole } from "@/app/lib/discord/guild.service";
import { discordColorToHex } from "@/app/lib/utils/colors";

interface RoleSelectorProps {
  value: string | null;
  onChange: (roleId: string | null) => void;
  disabled?: boolean;
  error?: string;
  allowNone?: boolean;
  isModified?: boolean;
}

export function RoleSelector({
  value,
  onChange,
  disabled = false,
  error,
  allowNone = true,
  isModified = false,
}: RoleSelectorProps) {
  const params = useParams();
  const guildId = params.guildId as string;
  const { guildDetails } = useGuildContext();

  const currentGuildDetails = guildDetails[guildId];
  const allRoles: CachedRole[] = currentGuildDetails?.roles || [];

  const roles = allRoles.filter((role) => !role.managed && role.id !== guildId);

  const options: string[] = [];
  if (allowNone) {
    options.push("");
  }
  options.push(...roles.map((role) => role.id));

  const getDisplayText = (roleId: string) => {
    if (!roleId) return allowNone ? "No role selected" : "";
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : roleId;
  };

  const renderRoleOption = (roleId: string) => {
    if (!roleId) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-neutral-500"></div>
          <span>No role selected</span>
        </div>
      );
    }

    const role = roles.find((r) => r.id === roleId);
    if (!role) return roleId;

    const colorHex = discordColorToHex(role.color);

    return (
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded-full border border-zinc-600"
          style={{ backgroundColor: colorHex }}
        ></div>
        <span>{role.name}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <SelectInput
        value={value || ""}
        onChange={(newValue) => onChange(newValue || null)}
        options={options}
        disabled={disabled}
        error={error}
        isModified={isModified}
        placeholder={allowNone ? "No role selected" : "Choose a role"}
        getDisplayText={getDisplayText}
        renderOption={renderRoleOption}
      />
    </div>
  );
}
