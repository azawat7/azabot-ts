"use client";

import { useGuildContext } from "../../../contexts/GuildContext";
import { useParams } from "next/navigation";
import { SelectInput } from "./FormField";
import { CachedChannel } from "@/app/lib/discord/guild.service";
import { ChannelType } from "discord-api-types/v10";

interface ChannelSelectorProps {
  value: string | null;
  onChange: (channelId: string | null) => void;
  disabled?: boolean;
  error?: string;
  allowNone?: boolean;
  channelTypes?: ChannelType[];
}

export function ChannelSelector({
  value,
  onChange,
  disabled = false,
  error,
  allowNone = true,
  channelTypes = [ChannelType.GuildText],
}: ChannelSelectorProps) {
  const params = useParams();
  const guildId = params.guildId as string;
  const { guildDetails } = useGuildContext();

  const currentGuildDetails = guildDetails[guildId];
  const channels: CachedChannel[] = currentGuildDetails?.channels || [];

  const filteredChannels = channels.filter((channel) =>
    channelTypes.includes(channel.type)
  );

  const options: string[] = [];
  if (allowNone) {
    options.push("");
  }
  options.push(...filteredChannels.map((channel) => channel.id));

  const getDisplayText = (channelId: string) => {
    if (!channelId) return allowNone ? "No channel selected" : "";
    const channel = filteredChannels.find((c) => c.id === channelId);
    return channel ? `#${channel.name}` : channelId;
  };

  return (
    <div className="space-y-2">
      <SelectInput
        value={value || ""}
        onChange={(newValue) => onChange(newValue || null)}
        options={options}
        disabled={disabled}
        error={error}
        placeholder={allowNone ? "No channel selected" : "Choose a channel"}
        getDisplayText={getDisplayText}
      />
    </div>
  );
}
