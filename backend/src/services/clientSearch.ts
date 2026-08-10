import { escapeRegex } from "../utils/escapeRegex.js";
import { digitsOnly } from "../utils/phone.js";

/** Match clients by partial phone (digits or display) or name. */
export function buildClientSearchFilter(q: string): Record<string, unknown> {
  const trimmed = q.trim();
  const pattern = escapeRegex(trimmed);
  const or: Record<string, unknown>[] = [
    { phone: { $regex: pattern, $options: "i" } },
    { name: { $regex: pattern, $options: "i" } },
  ];

  const digits = digitsOnly(trimmed);
  if (digits) {
    or.push({ phoneNormalized: { $regex: escapeRegex(digits) } });
  }

  return { $or: or };
}
