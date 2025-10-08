export function discordColorToHex(color: number): string {
  if (color === 0) {
    return "#99AAB5";
  }

  const hex = color.toString(16).padStart(6, "0").toUpperCase();
  return `#${hex}`;
}
