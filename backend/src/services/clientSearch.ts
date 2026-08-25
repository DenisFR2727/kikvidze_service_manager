import { escapeRegex } from "../utils/escapeRegex.js";
import { digitsOnly } from "../utils/phone.js";

/**
 * Match clients owned by `adminId` by partial phone (digits or display) or name.
 * Always scoped to the session admin (FR-008 / FR-011).
 */
export function buildClientSearchFilter(
  adminId: string,
  q?: string,
): Record<string, unknown> {
  const filter: Record<string, unknown> = { adminId };

  const trimmed = q?.trim() ?? "";
  if (!trimmed) {
    return filter;
  }

  const pattern = escapeRegex(trimmed);
  const or: Record<string, unknown>[] = [
    { phone: { $regex: pattern, $options: "i" } },
    { name: { $regex: pattern, $options: "i" } },
  ];

  const digits = digitsOnly(trimmed);
  if (digits) {
    or.push({ phoneNormalized: { $regex: escapeRegex(digits) } });
  }

  filter.$or = or;
  return filter;
}
