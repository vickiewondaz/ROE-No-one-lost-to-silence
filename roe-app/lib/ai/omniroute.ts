// OmniRoute adapter — the "smart post office" (lib/ai).
// OpenAI-compatible endpoint (default http://localhost:20128/v1), model `auto`
// lets OmniRoute pick free/fast/healthy + fail over invisibly. ROE keeps:
// auth → org context → authz → minimal fetch → policy filter → THIS adapter →
// validate → human review → record. Flagged OFF until pilot gate passes (P1).
// No UI imports this yet.

export interface OmniConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
  timeoutMs: number;
}

export function omniConfig(): OmniConfig {
  return {
    baseUrl:
      process.env.OMNIROUTE_BASE_URL ?? "http://localhost:20128/v1",
    apiKey: process.env.OMNIROUTE_API_KEY,
    model: process.env.OMNIROUTE_MODEL ?? "auto",
    timeoutMs: Number(process.env.OMNIROUTE_TIMEOUT_MS ?? 45000),
  };
}

export interface OmniResult {
  text: string;
  /** Which helper served it — log to audit_logs (accountability). */
  decision: string;
  model: string;
}

export async function omniChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: Partial<OmniConfig>,
  fetchFn: typeof fetch = fetch
): Promise<OmniResult> {
  const cfg = { ...omniConfig(), ...opts };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const r = await fetchFn(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: cfg.model, messages }),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`omniroute ${r.status}`);
    const decision =
      r.headers.get("x-omniroute-decision") ?? "unreported";
    const j = (await r.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
    };
    const text = j.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("omniroute empty reply");
    return { text, decision, model: j.model ?? cfg.model };
  } finally {
    clearTimeout(t);
  }
}

// ROE-side prompt guardrails live here (not in OmniRoute): calm, factual,
// never judging the person. Example builder for the Ana welcome-message case.
export function welcomeMessagePrompt(firstName: string, context: string): { role: "user"; content: string }[] {
  return [
    {
      role: "user",
      content: `Write a short, warm church welcome message for newcomer ${firstName}. Context: ${context}. Rules: under 60 words, personal not generic, invite (don't pressure) one next step, no spiritual judgments, no assumptions about their life. Plain text only.`,
    },
  ];
}
