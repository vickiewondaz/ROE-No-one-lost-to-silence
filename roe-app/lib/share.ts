// Referral share copy: pastor-to-pastor, plain words. Pure builders — tested.
export const ROE_SITE = "https://roe-pilot.netlify.app";

export function buildShareText(churchName?: string | null): string {
  const who = churchName ? `At ${churchName}, we` : "We";
  return (
    `${who} stopped losing newcomers with ROE — every visitor gets followed ` +
    `up and connected, so no one is lost to silence. See how it works: ${ROE_SITE}`
  );
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
