// Transactional email via Resend (server only). Best-effort: returns
// {sent} and never throws — email is backup/formal channel, WhatsApp primary.
// Without RESEND_API_KEY everything no-ops (dev safe). Test sender
// onboarding@resend.dev only reaches the account email; verify a domain
// for real recipients, then set RESEND_FROM.
import { Resend } from "resend";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function from(): string {
  return process.env.RESEND_FROM ?? "ROE <onboarding@resend.dev>";
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ sent: boolean }> {
  try {
    const rc = client();
    if (!rc) return { sent: false };
    const { error } = await rc.emails.send({ from: from(), to, subject, html });
    if (error) return { sent: false };
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

const wrap = (title: string, body: string) =>
  `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#17201F">` +
  `<p style="font-size:11px;letter-spacing:2px;color:#667370">ROE · NO ONE LOST TO SILENCE</p>` +
  `<h1 style="font-size:22px">${title}</h1>${body}` +
  `<p style="font-size:12px;color:#667370">Automate the administration. Personalise the relationship.</p></div>`;

export function resetPasswordEmail(link: string) {
  return {
    subject: "Reset your ROE password",
    html: wrap(
      "Reset your password",
      `<p>Someone asked to reset the password for this email. If that was you:</p>` +
        `<p><a href="${link}" style="background:#0F766E;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Choose a new password</a></p>` +
        `<p>Or paste this link: ${link}</p>` +
        `<p>It expires in one hour. If it wasn't you, ignore this — nothing changes.</p>`
    ),
  };
}

export function inviteEmail(orgName: string, role: string, link: string) {
  return {
    subject: `You're invited to ${orgName} on ROE`,
    html: wrap(
      `Join ${orgName}`,
      `<p>You've been invited as <strong>${role}</strong>. Accept within 7 days:</p>` +
        `<p><a href="${link}" style="background:#0F766E;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Accept invitation</a></p>` +
        `<p>Or paste this link: ${link}</p>`
    ),
  };
}
