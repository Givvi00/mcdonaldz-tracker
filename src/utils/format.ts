const BRAND_PREFIX = /^mcdonald[’']?s\s+/i;

export function shortMcName(name: string): string {
  const stripped = name.replace(BRAND_PREFIX, '').trim();
  return stripped || name;
}
