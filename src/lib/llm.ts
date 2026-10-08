import { sanitizeForModel } from "@/lib/privacy";

/**
 * Open-weight model gateway.
 *
 * Supported providers:
 * - Groq: https://api.groq.com/openai/v1/chat/completions
 * - Together.ai: https://api.together.ai/v1/chat/completions
 *
 * Both use OpenAI-compatible payloads, but AutoApply does not require or call
 * proprietary OpenAI models. Every user prompt is redacted locally first.
 */
export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: "groq" | "together";
};

export function getLlmConfig(): LlmConfig | null {
  const override = process.env.LLM_BASE_URL;
  const modelOverride = process.env.LLM_MODEL;

  if (process.env.GROQ_API_KEY) {
    return {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: override ?? "https://api.groq.com/openai/v1",
      model: modelOverride ?? "llama-3.3-70b-versatile",
      provider: "groq",
    };
  }

  if (process.env.TOGETHER_API_KEY) {
    return {
      apiKey: process.env.TOGETHER_API_KEY,
      baseUrl: override ?? "https://api.together.ai/v1",
      model: modelOverride ?? "Qwen/Qwen3.5-9B",
      provider: "together",
    };
  }

  return null;
}

export function isLlmAvailable(): boolean {
  return getLlmConfig() !== null;
}

export async function chatCompletion(
  system: string,
  user: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    knownPii?: string[];
  } = {},
): Promise<string | null> {
  const config = getLlmConfig();
  if (!config) return null;

  const { sanitized } = await sanitizeForModel(user, options.knownPii ?? []);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: options.temperature ?? 0,
        max_tokens: options.maxTokens ?? 700,
        messages: [
          { role: "system", content: system },
          { role: "user", content: sanitized },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
