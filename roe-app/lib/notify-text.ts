// Notification copy: one friendly line per type, graceful fallback for
// future types. Pure — unit-tested.
const COPY: Record<string, string> = {
  assignment: "New assignment for you",
};

export function notificationText(type: string): string {
  if (COPY[type]) return COPY[type];
  const words = type.replace(/[_-]+/g, " ").trim();
  if (!words) return "Update for you";
  return words.charAt(0).toUpperCase() + words.slice(1);
}
