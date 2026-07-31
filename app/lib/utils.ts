import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // Determine the appropriate unit by calculating the log
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format with 2 decimal places and round
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();

/**
 * Turns any thrown value into a readable string. Puter rejects with plain
 * objects (e.g. { success: false, error: { message } }) rather than Error
 * instances, which would otherwise stringify to "[object Object]".
 */
export function stringifyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, any>;
    const inner = anyErr.error ?? anyErr;
    if (typeof inner === "string") return inner;
    if (inner && typeof inner.message === "string") return inner.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

/**
 * Extracts the assistant's text from a Puter AI response's `message.content`,
 * which may be a plain string or an array of content blocks.
 */
export function extractAIText(content: string | any[]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => (typeof block === "string" ? block : block?.text ?? ""))
      .join("")
      .trim();
  }
  return "";
}

/**
 * Parses JSON returned by an LLM, tolerating common wrappers such as
 * ```json fenced code blocks or leading/trailing prose. Returns the parsed
 * value, or throws if no valid JSON object/array can be recovered.
 */
export function parseJsonFromAI<T = unknown>(text: string): T {
  const trimmed = text.trim();

  // Strip a surrounding markdown code fence, e.g. ```json ... ``` or ``` ... ```
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Fall back to extracting the first {...} or [...] block from the text.
    const match = candidate.match(/[{[][\s\S]*[}\]]/);
    if (!match) throw new Error("No JSON object found in AI response");
    return JSON.parse(match[0]) as T;
  }
}