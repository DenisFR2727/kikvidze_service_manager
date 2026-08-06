/**
 * Phone helpers for Client uniqueness and search.
 * UA-oriented: local `0XXXXXXXXX` → `380XXXXXXXXX`; storage is digits-only.
 */

const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

/** Strip everything except digits. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Normalize phone for uniqueness / lookup.
 * - Keeps digits only
 * - Ukrainian local form starting with `0` + 9 digits → prefix `380`
 * - Strips a leading trunk `0` after country code is already present is not applied
 */
export function normalizePhone(input: string): string {
  let digits = digitsOnly(input.trim());

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // UA local: 0671234567 → 380671234567
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `380${digits.slice(1)}`;
  }

  return digits;
}

/**
 * Pretty display form for API responses (E.164-like with `+`).
 */
export function formatPhoneDisplay(normalizedOrRaw: string): string {
  const normalized = normalizePhone(normalizedOrRaw);
  if (!normalized) {
    return "";
  }
  return `+${normalized}`;
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

export type ParsedPhone = {
  /** Digits-only value used for unique index / search */
  phoneNormalized: string;
  /** Display value stored on Client.phone */
  phone: string;
};

/**
 * Parse user input into stored phone fields.
 * @throws Error if empty or invalid length after normalize
 */
export function parsePhone(input: string): ParsedPhone {
  const phoneNormalized = normalizePhone(input);

  if (!phoneNormalized) {
    throw new Error("Phone is required");
  }

  if (!isValidNormalizedPhone(phoneNormalized)) {
    throw new Error(
      `Phone must contain ${MIN_DIGITS}–${MAX_DIGITS} digits after normalization`,
    );
  }

  return {
    phoneNormalized,
    phone: formatPhoneDisplay(phoneNormalized),
  };
}
