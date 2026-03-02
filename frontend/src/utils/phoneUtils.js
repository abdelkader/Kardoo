import { parsePhoneNumberWithError } from "libphonenumber-js";

export function normalizePhone(number) {
  if (!number) return null;

  const cleaned = number.replace(/[\s\-().]/g, "");

  if (cleaned.startsWith("+")) {
    try {
      const parsed = parsePhoneNumberWithError(cleaned);
      if (parsed?.isValid()) {
        return { normalized: parsed.number, hasCountry: true };
      }
    } catch {
      // fall through
    }
  }

  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length < 4) return null;
  return {
    normalized: digitsOnly.slice(-8),
    hasCountry: false,
  };
}

export function arePhonesSimilar(a, b) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);

  if (!na || !nb) return { match: false, confidence: null };

  if (na.normalized === nb.normalized) {
    const confidence = na.hasCountry && nb.hasCountry ? "certain" : "probable";
    return { match: true, confidence };
  }

  return { match: false, confidence: null };
}
