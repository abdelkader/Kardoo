import { arePhonesSimilar } from "./phoneUtils";

/**
 * Normalise un nom pour comparaison (lowercase, trim, espaces multiples)
 */
function normalizeName(name) {
  return (name || "").toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Vérifie si deux contacts ont un nom similaire
 */
function areNamesSimilar(a, b) {
  const na = normalizeName(a.fn);
  const nb = normalizeName(b.fn);
  if (!na || !nb) return false;
  return na === nb;
}

function shareEmail(a, b) {
  const emailsA = a.email?.filter((e) => e.value) || [];
  const emailsB = b.email?.filter((e) => e.value) || [];

  if (emailsA.length === 0 || emailsB.length === 0) return false;

  return emailsA.some((ea) =>
    emailsB.some((eb) => ea.value.toLowerCase() === eb.value.toLowerCase()),
  );
}

/**
 * Vérifie si deux contacts partagent au moins un numéro de téléphone
 * Retourne { match: bool, confidence: "certain" | "probable" }
 */
function sharePhone(a, b) {
  const telsA = a.tel?.filter((t) => t.value) || [];
  const telsB = b.tel?.filter((t) => t.value) || [];

  if (telsA.length === 0 || telsB.length === 0) {
    return { match: false, confidence: null };
  }

  let bestConfidence = null;

  for (const ta of telsA) {
    for (const tb of telsB) {
      const result = arePhonesSimilar(ta.value, tb.value);
      if (result.match) {
        if (result.confidence === "certain")
          return { match: true, confidence: "certain" };
        bestConfidence = "probable";
      }
    }
  }

  if (bestConfidence) return { match: true, confidence: bestConfidence };
  return { match: false, confidence: null };
}

export function findDuplicates(
  contacts,
  options = { checkName: true, checkPhone: true, checkEmail: false },
) {
  const nonGroups = contacts.filter((c) => c.kind !== "group");
  const visited = new Set();
  const groups = [];

  for (let i = 0; i < nonGroups.length; i++) {
    if (visited.has(nonGroups[i].id)) continue;

    const group = [nonGroups[i]];
    let groupReason = null;
    let groupConfidence = null;

    for (let j = i + 1; j < nonGroups.length; j++) {
      if (visited.has(nonGroups[j].id)) continue;

      const a = nonGroups[i];
      const b = nonGroups[j];

      const sameName = options.checkName && areNamesSimilar(a, b);
      const phoneResult = options.checkPhone
        ? sharePhone(a, b)
        : { match: false };
      const sameEmail = options.checkEmail && shareEmail(a, b);

      let reason = null;
      let confidence = null;

      if (sameName && phoneResult.match && sameEmail) {
        reason = "all";
        confidence =
          phoneResult.confidence === "certain" ? "certain" : "probable";
      } else if (sameName && phoneResult.match) {
        reason = "both";
        confidence =
          phoneResult.confidence === "certain" ? "certain" : "probable";
      } else if (sameName && sameEmail) {
        reason = "name_email";
        confidence = "probable";
      } else if (phoneResult.match && sameEmail) {
        reason = "phone_email";
        confidence =
          phoneResult.confidence === "certain" ? "certain" : "probable";
      } else if (sameName) {
        reason = "name";
        confidence = "probable";
      } else if (phoneResult.match) {
        reason = "phone";
        confidence = phoneResult.confidence;
      } else if (sameEmail) {
        reason = "email";
        confidence = "probable";
      }

      if (reason) {
        group.push(b);
        visited.add(b.id);
        if (confidence === "certain") groupConfidence = "certain";
        else if (!groupConfidence) groupConfidence = "probable";
        if (reason === "all") groupReason = "all";
        else if (reason === "both" && groupReason !== "all")
          groupReason = "both";
        else if (!groupReason) groupReason = reason;
      }
    }

    if (group.length > 1) {
      visited.add(nonGroups[i].id);
      groups.push({
        contacts: group,
        reason: groupReason,
        confidence: groupConfidence,
      });
    }
  }

  return groups;
}

/**
 * Fusionne un groupe de contacts en gardant le plus complet.
 * Priorité : le contact avec le plus de champs remplis.
 */
export function mergeContacts(contactGroup) {
  // Trier par "complétude" — plus de champs = meilleur
  const scored = contactGroup.map((c) => ({
    contact: c,
    score:
      (c.fn ? 1 : 0) +
      (c.firstName ? 1 : 0) +
      (c.lastName ? 1 : 0) +
      (c.photo ? 3 : 0) +
      (c.org ? 1 : 0) +
      (c.note ? 1 : 0) +
      (c.tel?.length || 0) +
      (c.email?.length || 0) +
      (c.adr?.length || 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  const base = { ...scored[0].contact };

  // Fusionner les tableaux (tel, email, adr, url) sans doublons
  const mergeLists = (field, keyFn) => {
    const all = contactGroup.flatMap((c) => c[field] || []);
    const seen = new Set();
    return all.filter((item) => {
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  base.tel = mergeLists("tel", (t) => t.value?.replace(/\D/g, "").slice(-8));
  base.email = mergeLists("email", (e) => e.value?.toLowerCase());
  base.adr = mergeLists("adr", (a) => a.raw?.join(";"));
  base.url = mergeLists("url", (u) => u.value);

  // Prendre les champs texte du contact le plus complet, sinon fallback
  for (const field of [
    "photo",
    "org",
    "title",
    "note",
    "bday",
    "nickname",
    "role",
  ]) {
    if (!base[field]) {
      for (const { contact } of scored) {
        if (contact[field]) {
          base[field] = contact[field];
          break;
        }
      }
    }
  }

  return base;
}
