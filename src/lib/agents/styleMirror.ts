import type { StyleProfile, StyleRewriteKind } from "./types";
import { chatCompletion, getLlmConfig } from "@/lib/llm";

const TRANSITIONS = [
  "however", "therefore", "because", "for example", "in practice", "in short",
  "as a result", "that said", "meanwhile", "ultimately", "specifically", "also",
];

const STOPWORDS = new Set([
  "this", "that", "with", "from", "have", "your", "their", "about", "would",
  "could", "should", "there", "where", "when", "which", "while", "into", "because",
  "been", "were", "they", "them", "then", "than", "what", "will", "just", "also",
]);

function sentenceList(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 2);
}

function frequentPhrases(text: string): string[] {
  const words = (text.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [])
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));
  const counts = new Map<string, number>();

  for (let i = 0; i < words.length - 1; i += 1) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([phrase]) => phrase);
}

export function analyzeWritingStyle(samples: string[]): StyleProfile {
  const text = samples.join("\n\n");
  const sentences = sentenceList(text);
  const words = text.match(/\b[\w'-]+\b/g) ?? [];
  const average = sentences.length
    ? Math.round((words.length / sentences.length) * 10) / 10
    : 12;
  const contractionsCount = (text.match(/\b\w+(?:'t|'re|'ve|'ll|'d|'m|'s)\b/gi) ?? []).length;
  const contractionRate = contractionsCount / Math.max(words.length, 1);
  const firstPerson = (text.match(/\b(I|I'm|I've|I'd|my|me)\b/g) ?? []).length;
  const exclamations = (text.match(/!/g) ?? []).length;
  const questions = (text.match(/\?/g) ?? []).length;
  const dashes = (text.match(/[—–]/g) ?? []).length;
  const semicolons = (text.match(/;/g) ?? []).length;
  const bullets = (text.match(/^\s*[-•*]/gm) ?? []).length;
  const formalSignals = (text.match(/\b(furthermore|moreover|consequently|regarding|therefore|demonstrated|facilitated)\b/gi) ?? []).length;
  const casualSignals = (text.match(/\b(really|honestly|pretty|kind of|a bit|love|excited|great)\b/gi) ?? []).length;

  const formality: StyleProfile["formality"] =
    formalSignals > casualSignals + 1 && contractionRate < 0.01
      ? "formal"
      : casualSignals > formalSignals || contractionRate > 0.025
        ? "casual"
        : "balanced";

  const sentenceLength: StyleProfile["sentenceLength"] =
    average < 12 ? "short" : average > 22 ? "long" : "mixed";

  const directness: StyleProfile["directness"] =
    firstPerson >= sentences.length * 0.7
      ? "direct"
      : average > 20
        ? "narrative"
        : "measured";

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const averageParagraphWords = paragraphs.length ? words.length / paragraphs.length : words.length;
  const paragraphLength: StyleProfile["paragraphLength"] =
    averageParagraphWords < 45 ? "compact" : averageParagraphWords > 100 ? "extended" : "balanced";

  const tone = new Set<string>();
  tone.add(directness === "direct" ? "decisive" : "thoughtful");
  tone.add(formality === "formal" ? "professional" : formality === "casual" ? "conversational" : "clear");
  if (exclamations > 0) tone.add("energetic");
  if (questions > 0) tone.add("curious");
  if (/\b(result|impact|improved|reduced|increased|delivered)\b/i.test(text)) tone.add("outcome-focused");

  const punctuationHabits: string[] = [];
  if (dashes > 0) punctuationHabits.push("uses em dashes for emphasis");
  if (semicolons > 0) punctuationHabits.push("connects related ideas with semicolons");
  if (bullets > 1) punctuationHabits.push("prefers scannable bullets");
  if (exclamations > 1) punctuationHabits.push("uses occasional exclamation marks");
  if (!punctuationHabits.length) punctuationHabits.push("uses simple, conventional punctuation");

  const transitionWords = TRANSITIONS.filter((transition) =>
    text.toLowerCase().includes(transition),
  );
  const preferredPhrases = frequentPhrases(text);
  const contractions: StyleProfile["contractions"] =
    contractionRate === 0 ? "avoid" : contractionRate > 0.025 ? "frequent" : "occasional";

  return {
    tone: [...tone],
    formality,
    directness,
    sentenceLength,
    averageWordsPerSentence: average,
    paragraphLength,
    contractions,
    punctuationHabits,
    preferredPhrases,
    transitionWords,
    dos: [
      `${sentenceLength === "short" ? "Keep sentences compact" : sentenceLength === "long" ? "Allow developed sentences" : "Mix concise and developed sentences"}.`,
      `${directness === "direct" ? "Lead with the point and use active voice" : "Build context before the key claim"}.`,
      `Keep the tone ${[...tone].join(", ")}.`,
      `${paragraphLength === "compact" ? "Use short, scannable paragraphs" : "Use complete paragraphs with clear internal flow"}.`,
    ],
    donts: [
      "Do not invent facts, skills, employers, or metrics.",
      "Avoid generic AI phrases such as 'delve', 'leverage synergies', and 'in today's fast-paced world'.",
      formality === "formal" ? "Avoid slang and excessive contractions." : "Avoid stiff, legalistic wording.",
      "Do not overuse adjectives or empty enthusiasm.",
    ],
    voiceSignature: `${[...tone].join(", ")} voice; ${sentenceLength} sentences averaging ${average} words; ${formality} formality; ${paragraphLength} paragraphs; ${contractions} contractions.`,
    sampleCount: samples.length,
    analyzedAt: new Date().toISOString(),
  };
}

function deterministicRewrite(text: string, style: StyleProfile): string {
  let output = text.trim();

  // Remove common machine-written filler without changing factual content.
  output = output
    .replace(/\bin today's fast-paced (?:world|environment),?\s*/gi, "")
    .replace(/\bI am writing to express my (?:strong )?interest in\b/gi, "I'm interested in")
    .replace(/\bI believe that\b/gi, "I believe")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bleverage\b/gi, "use")
    .replace(/\bdelve into\b/gi, "explore")
    .replace(/\s{2,}/g, " ");

  if (style.contractions !== "avoid") {
    output = output
      .replace(/\bI am\b/g, "I'm")
      .replace(/\bI have\b/g, "I've")
      .replace(/\bI would\b/g, "I'd")
      .replace(/\bdo not\b/gi, "don't")
      .replace(/\bcannot\b/gi, "can't");
  }

  if (style.paragraphLength === "compact") {
    const sentences = sentenceList(output);
    output = sentences.reduce((result, sentence, index) => {
      const separator = index > 0 && index % 2 === 0 ? "\n\n" : index ? " " : "";
      return result + separator + sentence;
    }, "");
  }

  return output;
}

export async function rewriteInStyle(options: {
  text: string;
  kind: StyleRewriteKind;
  style: StyleProfile;
  knownPii?: string[];
  forceDeterministic?: boolean;
}): Promise<{ text: string; provider: string; modelUsed: boolean }> {
  const config = options.forceDeterministic ? null : getLlmConfig();
  if (config) {
    const protectedValues = new Map<string, string>();
    let protectedText = options.text;
    for (const [index, value] of (options.knownPii ?? []).filter(Boolean).entries()) {
      if (value.trim().length < 3) continue;
      const token = `[[LOCAL_DETAIL_${index}]]`;
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      protectedText = protectedText.replace(new RegExp(escaped, "gi"), token);
      protectedValues.set(token, value);
    }

    const result = await chatCompletion(
      `You are Style Mirror, a precision writing editor. Rewrite the supplied ${options.kind.replaceAll("_", " ")} in the exact style fingerprint. Preserve every fact, number, skill, employer, date, and claim. Preserve all [[LOCAL_DETAIL_N]] tokens exactly. Do not add any new factual information. Do not mention the style profile or redaction placeholders. Return only the rewritten text.`,
      `STYLE FINGERPRINT:\n${JSON.stringify(options.style)}\n\nTEXT TO REWRITE:\n${protectedText}`,
      {
        temperature: 0.25,
        maxTokens: Math.min(1200, Math.max(250, options.text.length)),
      },
    );
    if (result) {
      let restored = result;
      for (const [token, value] of protectedValues) restored = restored.replaceAll(token, value);
      return { text: restored, provider: config.provider, modelUsed: true };
    }
  }

  return {
    text: deterministicRewrite(options.text, options.style),
    provider: "deterministic",
    modelUsed: false,
  };
}
