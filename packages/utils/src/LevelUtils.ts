import { LevelFormula } from "@shaw/types";

const xpCurves: Record<LevelFormula, { baseXP: number; multiplier: number }> = {
  Easy: { baseXP: 90, multiplier: 1.45 },
  Medium: { baseXP: 135, multiplier: 1.5344 },
  Hard: { baseXP: 170, multiplier: 1.7 },
};

export class LevelUtils {
  static getXPForLevel(level: number, formula: LevelFormula): number {
    const { baseXP, multiplier } = xpCurves[formula];
    return Math.round(baseXP * Math.pow(level, multiplier));
  }

  static getLevelFromXP(xp: number, formula: LevelFormula): number {
    const { baseXP, multiplier } = xpCurves[formula];
    return Math.floor(Math.pow(xp / baseXP, 1 / multiplier));
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
