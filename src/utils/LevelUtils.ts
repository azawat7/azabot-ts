export type LevelFormula = "linear" | "exponential" | "flat";
export class LevelUtils {
  static getXPForLevel(level: number, formula: LevelFormula, customFormula?: string): number {
    switch (formula) {
      case "linear":
        return level * 100 + 75;
      case "exponential":
        return 5 * (level ** 2) + level * 50 + 75;
      case "flat":
        return 1000 * level
    }
  }

  static getLevelFromXP(xp: number, formula: LevelFormula): number {
    let level = 1;
    while (this.getXPForLevel(level + 1, formula) <= xp) {
      level++;
    }
    return level;
  }

  static getLevelProgress(
    currentXP: number,
    currentLevel: number,
    formula: LevelFormula
  ): number {
    const currentLevelXP = this.getXPForLevel(currentLevel, formula);
    const nextLevelXP = this.getXPForLevel(currentLevel + 1, formula);
    const progressXP = currentXP - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    return Math.min(progressXP / totalXPNeeded, 1);
  }

  static addXP(
    currentXP: number,
    xpToAdd: number,
    formula: LevelFormula
  ): { newXP: number; newLevel: number; leveledUp: boolean } {
    const newXP = currentXP + xpToAdd;
    const newLevel = this.getLevelFromXP(newXP, formula);
    const oldLevel = this.getLevelFromXP(currentXP, formula);

    return {
      newXP,
      newLevel,
      leveledUp: newLevel > oldLevel,
    };
  }
}
