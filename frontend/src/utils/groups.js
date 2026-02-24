/**
 * Résout les membres d'un groupe vers les contacts correspondants
 * - mailto: → match par email
 * - urn:uuid: → match par uid
 */
export function resolveMembers(group, contacts) {
  return (
    group.members?.map((m) => {
      let resolved = null;
      const normalizeUid = (uid) => uid?.replace(/^urn:uuid:/i, "").trim();

      if (m.type === "email") {
        resolved = contacts.find((c) =>
          c.email?.some(
            (e) => e.value?.toLowerCase() === m.value?.toLowerCase(),
          ),
        );
      } else if (m.type === "uid") {
        const memberUid = normalizeUid(m.value);
        resolved = contacts.find((c) => normalizeUid(c.uid) === memberUid);
      }

      return { ...m, resolved };
    }) || []
  );
}

/**
 * Sépare les contacts en groupes et contacts sans groupe
 * Retourne { groups, ungrouped }
 */
export function buildTree(contacts) {
  const groups = contacts.filter((c) => c.kind === "group");
  const members = contacts.filter((c) => c.kind !== "group");

  const assignedIds = new Set();

  const tree = groups.map((group) => {
    const resolved = resolveMembers(group, members);

    // ← marque tous les contacts résolus comme assignés
    resolved.forEach((m) => {
      if (m.resolved) assignedIds.add(m.resolved.id);
    });

    return { group, members: resolved };
  });

  const ungrouped = members.filter((c) => !assignedIds.has(c.id));

  return { tree, ungrouped };
}
