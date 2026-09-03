const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

/** Strip everything except digits. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Normalize phone for validation (mirrors backend rules).
 * UA local `0XXXXXXXXX` → `380XXXXXXXXX`; result is digits-only.
 */
export function normalizePhone(input: string): string {
  let digits = digitsOnly(input.trim());

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `380${digits.slice(1)}`;
  }

  return digits;
}

export function isValidNormalizedPhone(normalized: string): boolean {
  return (
    /^\d+$/.test(normalized) &&
    normalized.length >= MIN_DIGITS &&
    normalized.length <= MAX_DIGITS
  );
}

export function isValidPhoneInput(input: string): boolean {
  return isValidNormalizedPhone(normalizePhone(input));
}

/** Keep only characters allowed while typing a phone number. */
export function sanitizePhoneInput(raw: string): string {
  let result = "";

  for (const char of raw) {
    if (
      /\d/.test(char) ||
      char === " " ||
      char === "-" ||
      char === "(" ||
      char === ")"
    ) {
      result += char;
    } else if (char === "+" && result.length === 0) {
      result += char;
    }
  }

  return result;
}
