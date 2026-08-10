/** Canonical search string for API `q` and committed controlled value. */
export function normalizeJobSearch(raw: string): string {
  return raw.trim();
}

/** Whether draft should replace the committed (already normalized) value. */
export function shouldCommitJobSearch(
  draft: string,
  committed: string,
): boolean {
  return normalizeJobSearch(draft) !== normalizeJobSearch(committed);
}
