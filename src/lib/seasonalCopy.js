export function getHeroEyebrow() {
  const now = new Date();
  const isAprilFools = now.getMonth() === 3 && now.getDate() === 1;
  if (isAprilFools) return "Allegedly a creative house";

  const hour = now.getHours();
  const isLateNight = hour >= 0 && hour < 5;
  if (isLateNight) return "Technical creative house (still up, apparently)";

  return "Technical creative house";
}
