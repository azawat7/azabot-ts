import { LevelFormula } from "@shaw/types";

export class LevelUtils {
  static getXPForLevel(level: number, formula: LevelFormula): number {
    switch (formula) {
      case "classic":
        return Math.floor(100 * Math.pow(level - 1, 1.5));
      case "exponential":
        return 5 * (level - 1) ** 2 + (level - 1) * 50 + 75;
      case "flat":
        return 1000 * (level - 1);
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
    console.log(currentXP, currentLevelXP, progressXP);
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
