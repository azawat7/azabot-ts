export class LevelUtils {
  static getXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level - 1, 1.5));
  }

  static getLevelFromXP(xp: number): number {
    let level = 1;
    while (this.getXPForLevel(level + 1) <= xp) {
      level++;
    }
    return level;
  }

  static getXPToNextLevel(currentXP: number, currentLevel: number): number {
    const nextLevelXP = this.getXPForLevel(currentLevel + 1);
    return nextLevelXP - currentXP;
  }

  static getLevelProgress(currentXP: number, currentLevel: number): number {
    const currentLevelXP = this.getXPForLevel(currentLevel);
    const nextLevelXP = this.getXPForLevel(currentLevel + 1);
    const progressXP = currentXP - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    return Math.min(progressXP / totalXPNeeded, 1);
  }

  static addXP(
    currentXP: number,
    xpToAdd: number
  ): { newXP: number; newLevel: number; leveledUp: boolean } {
    const newXP = currentXP + xpToAdd;
    const newLevel = this.getLevelFromXP(newXP);
    const oldLevel = this.getLevelFromXP(currentXP);

    return {
      newXP,
      newLevel,
      leveledUp: newLevel > oldLevel,
    };
  }
}
