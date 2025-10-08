import { createModuleConfig, createConfigCategory } from "./types";
import { createDependency, DependencyConditions } from "../config/types";

export type LevelFormula = "Easy" | "Medium" | "Hard";

export type NotificationLocation = "Disabled" | "Current" | "DM" | "Custom";

export interface RoleReward {
  level: number;
  roleId: string;
}

export interface LevelModuleSettings {
  enabled: boolean;
  messageXp: {
    formula: LevelFormula;
    minXp: number;
    maxXp: number;
    cooldown: number;
  };
  notifications: {
    location: NotificationLocation;
    channelId: string | null;
    message: string;
  };
  roleRewards: {
    stack: boolean;
    rewards: RoleReward[];
  };
}

export const LEVEL_MODULE_CONFIG = createModuleConfig({
  id: "leveling",
  name: "Leveling Module",
  description:
    "A leveling system with XP, role rewards, and customizable level rewards",
  icon: "📊",
  reactIconName: "HiSparkles",
  enabledByDefault: true,
  categories: {
    messageXp: createConfigCategory({
      name: "Message XP Settings",
      description: "Configure how users earn XP from sending messages",
      reactIconName: "HiMiniChatBubbleLeftEllipsis",
      order: 1,
      options: {
        formula: {
          name: "XP Calculation Formula",
          description: "Formula used to calculate XP required for each level",
          type: "select",
          options: ["Easy", "Medium", "Hard"] as LevelFormula[],
          default: "Medium",
          help: "On default settings | Level 10: Easy ~85 msgs, Medium ~154 msgs, Hard ~284 msgs | Level 50: Easy ~873 msgs, Medium ~1821 msgs, Hard ~4382 msgs",
        },
        minXp: {
          name: "Minimum XP per Message",
          description: "Minimum amount of XP awarded for each message",
          type: "number",
          min: 1,
          max: 200,
          default: 25,
          unit: "XP",
          crossFieldValidation: [
            {
              field: "messageXp.maxXp",
              condition: {
                type: "customCrossField",
                validator: (maxXp: number, currentValue: number) =>
                  currentValue <= maxXp,
              },
              errorMessage:
                "Minimum XP must be less than or equal to maximum XP",
            },
          ],
        },
        maxXp: {
          name: "Maximum XP per Message",
          description: "Maximum amount of XP awarded for each message",
          type: "number",
          min: 1,
          max: 200,
          default: 35,
          unit: "XP",
          crossFieldValidation: [
            {
              field: "messageXp.minXp",
              condition: {
                type: "customCrossField",
                validator: (minXp: number, currentValue: number) =>
                  currentValue >= minXp,
              },
              errorMessage:
                "Maximum XP must be greater than or equal to minimum XP",
            },
          ],
        },
        cooldown: {
          name: "XP Gain Cooldown",
          description: "Time users must wait between XP gains to prevent spam",
          type: "time",
          unit: "seconds",
          min: 10,
          max: 300,
          default: 60,
        },
      },
    }),

    notifications: createConfigCategory({
      name: "Level Up Notifications",
      description: "Configure where and how level up messages are sent",
      reactIconName: "HiBell",
      order: 2,
      options: {
        location: {
          name: "Notification Location",
          description: "Where to send level-up notifications",
          type: "select",
          options: [
            "Disabled",
            "Current",
            "DM",
            "Custom",
          ] as NotificationLocation[],
          default: "Disabled",
          help: "Disabled: No notifications | Current: Same channel | DM: Direct message | Custom: Specific channel",
        },
        channelId: {
          name: "Custom Channel ID",
          description: "Discord channel ID for custom level-up messages",
          type: "channel",
          default: null,
          allowNone: true,
          help: 'Only used when "Custom" location is selected',
          dependencies: [
            createDependency(
              "notifications.location",
              DependencyConditions.equals("custom")
            ),
          ],
        },
        message: {
          name: "Level Up Message Template",
          description: "Message template for level-up notifications",
          type: "string",
          default:
            "🎉 Congratulations {user}! You've reached **Level {level}**!",
          maxLength: 300,
          placeholder: "🎉 {user} reached level {level}!",
          help: "Use {user} for user mention and {level} for level number. Discord markdown is supported.",
          dependencies: [
            createDependency(
              "notifications.location",
              DependencyConditions.notEquals("disabled")
            ),
          ],
        },
      },
    }),

    roleRewards: createConfigCategory({
      name: "Role Rewards System",
      description:
        "Automatically assign roles when users reach specific levels",
      reactIconName: "HiTrophy",
      order: 3,
      options: {
        stack: {
          name: "Stack Role Rewards",
          description:
            "Allow users to keep previous level roles when earning new ones",
          type: "boolean",
          default: false,
        },
        rewards: {
          name: "Level Role Assignments",
          description:
            "List of level milestones and their corresponding role rewards",
          type: "array",
          itemType: {
            name: "Role Reward",
            description: "Level requirement and corresponding role to assign",
            type: "object",
            schema: {
              level: {
                name: "Required Level",
                description: "Level requirement",
                type: "number",
                min: 1,
                max: 1000,
                default: 1,
              },
              roleId: {
                name: "Role ID",
                description: "Discord role ID to assign",
                type: "role",
                default: null,
                allowNone: false,
              },
            },
            default: {},
          },
          maxItems: 25,
          default: [],
          crossFieldValidation: [
            {
              field: "roleRewards.rewards",
              condition: {
                type: "customCrossField",
                validator: (rewardsArray: any[], currentValue: any) => {
                  if (!Array.isArray(rewardsArray)) return true;
                  const levels = rewardsArray.map(
                    (reward: any) => reward.level
                  );
                  const levelCounts = new Map<number, number>();
                  for (const level of levels) {
                    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
                  }
                  for (const count of levelCounts.values()) {
                    if (count > 2) return false;
                  }

                  return true;
                },
              },
              errorMessage: "Each level can have a maximum of two role rewards",
            },
          ],
        },
      },
    }),
  },
});
