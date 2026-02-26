/**
 * Export formats conformes aux RFC
 * jCard : RFC 7095
 * xCard : RFC 6351
 * CSV   : format Google Contacts (standard de facto)
 */

// ─── jCard (RFC 7095) ────────────────────────────────────────────────────────

function contactToJCard(c) {
  const props = [];

  // VERSION — doit être en premier (RFC 7095 §3.3.1.1)
  props.push(["version", {}, "text", "4.0"]);

  // FN — obligatoire
  if (c.fn) props.push(["fn", {}, "text", c.fn]);

  // N — structured value as array
  if (c.lastName || c.firstName || c.middleName || c.prefix || c.suffix) {
    props.push([
      "n",
      {},
      "text",
      [
        c.lastName || "",
        c.firstName || "",
        c.middleName || "",
        c.prefix || "",
        c.suffix || "",
      ],
    ]);
  }

  // ORG
  if (c.org) props.push(["org", {}, "text", c.org]);

  // TITLE
  if (c.title) props.push(["title", {}, "text", c.title]);

  // ROLE
  if (c.role) props.push(["role", {}, "text", c.role]);

  // NICKNAME
  if (c.nickname) props.push(["nickname", {}, "text", c.nickname]);

  // BDAY
  if (c.bday) props.push(["bday", {}, "date", c.bday]);

  // ANNIVERSARY
  if (c.anniversary) props.push(["anniversary", {}, "date", c.anniversary]);

  // GENDER
  if (c.gender) props.push(["gender", {}, "text", c.gender]);

  // NOTE
  if (c.note) props.push(["note", {}, "text", c.note]);

  // GEO
  if (c.geo) props.push(["geo", {}, "uri", c.geo]);

  // TZ
  if (c.tz) props.push(["tz", {}, "text", c.tz]);

  // UID
  if (c.uid)
    props.push([
      "uid",
      {},
      "uri",
      c.uid.startsWith("urn:") ? c.uid : `urn:uuid:${c.uid}`,
    ]);

  // REV
  if (c.rev) props.push(["rev", {}, "timestamp", c.rev]);

  // KIND
  if (c.kind && c.kind !== "individual")
    props.push(["kind", {}, "text", c.kind]);

  // CATEGORIES
  if (c.categories) props.push(["categories", {}, "text", c.categories]);

  // TEL
  c.tel?.forEach((t) => {
    if (!t.value) return;
    const params = t.type ? { type: [t.type.toLowerCase()] } : {};
    props.push(["tel", params, "uri", `tel:${t.value}`]);
  });

  // EMAIL
  c.email?.forEach((e) => {
    if (!e.value) return;
    const params = e.type ? { type: [e.type.toLowerCase()] } : {};
    props.push(["email", params, "text", e.value]);
  });

  // ADR — structured value
  c.adr?.forEach((a) => {
    if (!a.raw) return;
    const params = a.type ? { type: [a.type.toLowerCase()] } : {};
    props.push([
      "adr",
      params,
      "text",
      [
        a.raw[0] || "", // PO box
        a.raw[1] || "", // extended
        a.raw[2] || "", // street
        a.raw[3] || "", // city
        a.raw[4] || "", // region
        a.raw[5] || "", // postal code
        a.raw[6] || "", // country
      ],
    ]);
  });

  // URL
  c.url?.forEach((u) => {
    if (!u.value) return;
    const params = u.type ? { type: [u.type.toLowerCase()] } : {};
    props.push(["url", params, "uri", u.value]);
  });

  // LANG
  c.lang?.forEach((l) => {
    if (!l.value) return;
    const params = l.pref ? { pref: l.pref } : {};
    props.push(["lang", params, "language-tag", l.value]);
  });

  // IMPP
  c.impp?.forEach((i) => {
    if (!i.value) return;
    const params = i.type ? { type: [i.type.toLowerCase()] } : {};
    props.push(["impp", params, "uri", i.value]);
  });

  // RELATED
  c.related?.forEach((r) => {
    if (!r.value) return;
    const params = r.type ? { type: [r.type.toLowerCase()] } : {};
    props.push(["related", params, "text", r.value]);
  });

  // MEMBER (pour les groupes)
  if (c.kind === "group") {
    c.members?.forEach((m) => {
      if (!m.value) return;
      const uri =
        m.type === "email" ? `mailto:${m.value}` : `urn:uuid:${m.value}`;
      props.push(["member", {}, "uri", uri]);
    });
  }

  return ["vcard", props];
}

export function toJCard(contacts) {
  const jcards = contacts.map(contactToJCard);
  return JSON.stringify(jcards.length === 1 ? jcards[0] : jcards, null, 2);
}

// ─── xCard (RFC 6351) ────────────────────────────────────────────────────────

const XCARD_NS = "urn:ietf:params:xml:ns:vcard-4.0";

function esc(val) {
  return String(val || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prop(name, params, valueType, value) {
  const lines = [`    <${name}>`];
  if (params && Object.keys(params).length > 0) {
    lines.push("      <parameters>");
    Object.entries(params).forEach(([k, v]) => {
      lines.push(`        <${k}>`);
      const vals = Array.isArray(v) ? v : [v];
      vals.forEach((vv) => lines.push(`          <text>${esc(vv)}</text>`));
      lines.push(`        </${k}>`);
    });
    lines.push("      </parameters>");
  }
  if (Array.isArray(value)) {
    value.forEach((v) =>
      lines.push(`      <${valueType}>${esc(v)}</${valueType}>`),
    );
  } else {
    lines.push(`      <${valueType}>${esc(value)}</${valueType}>`);
  }
  lines.push(`    </${name}>`);
  return lines.join("\n");
}

function contactToXCard(c) {
  const lines = ["  <vcard>"];

  lines.push(prop("version", {}, "text", "4.0"));
  if (c.fn) lines.push(prop("fn", {}, "text", c.fn));

  if (c.lastName || c.firstName || c.middleName || c.prefix || c.suffix) {
    lines.push(`    <n>`);
    lines.push(`      <surname>${esc(c.lastName)}</surname>`);
    lines.push(`      <given>${esc(c.firstName)}</given>`);
    lines.push(`      <additional>${esc(c.middleName)}</additional>`);
    lines.push(`      <prefix>${esc(c.prefix)}</prefix>`);
    lines.push(`      <suffix>${esc(c.suffix)}</suffix>`);
    lines.push(`    </n>`);
  }

  if (c.org) lines.push(prop("org", {}, "text", c.org));
  if (c.title) lines.push(prop("title", {}, "text", c.title));
  if (c.role) lines.push(prop("role", {}, "text", c.role));
  if (c.nickname) lines.push(prop("nickname", {}, "text", c.nickname));
  if (c.bday) lines.push(prop("bday", {}, "date", c.bday));
  if (c.anniversary) lines.push(prop("anniversary", {}, "date", c.anniversary));
  if (c.gender) lines.push(prop("gender", {}, "sex", c.gender));
  if (c.note) lines.push(prop("note", {}, "text", c.note));
  if (c.geo) lines.push(prop("geo", {}, "uri", c.geo));
  if (c.tz) lines.push(prop("tz", {}, "text", c.tz));
  if (c.uid)
    lines.push(
      prop(
        "uid",
        {},
        "uri",
        c.uid.startsWith("urn:") ? c.uid : `urn:uuid:${c.uid}`,
      ),
    );
  if (c.rev) lines.push(prop("rev", {}, "timestamp", c.rev));
  if (c.kind && c.kind !== "individual")
    lines.push(prop("kind", {}, "text", c.kind));
  if (c.categories) lines.push(prop("categories", {}, "text", c.categories));

  c.tel?.forEach((t) => {
    if (!t.value) return;
    const params = t.type ? { type: [t.type.toLowerCase()] } : {};
    lines.push(prop("tel", params, "uri", `tel:${t.value}`));
  });

  c.email?.forEach((e) => {
    if (!e.value) return;
    const params = e.type ? { type: [e.type.toLowerCase()] } : {};
    lines.push(prop("email", params, "text", e.value));
  });

  c.adr?.forEach((a) => {
    if (!a.raw) return;
    const params = a.type ? { type: [a.type.toLowerCase()] } : {};
    const paramStr =
      Object.keys(params).length > 0
        ? `\n      <parameters>\n        <type><text>${esc(a.type.toLowerCase())}</text></type>\n      </parameters>`
        : "";
    lines.push(`    <adr>${paramStr}`);
    lines.push(`      <pobox>${esc(a.raw[0])}</pobox>`);
    lines.push(`      <ext>${esc(a.raw[1])}</ext>`);
    lines.push(`      <street>${esc(a.raw[2])}</street>`);
    lines.push(`      <locality>${esc(a.raw[3])}</locality>`);
    lines.push(`      <region>${esc(a.raw[4])}</region>`);
    lines.push(`      <code>${esc(a.raw[5])}</code>`);
    lines.push(`      <country>${esc(a.raw[6])}</country>`);
    lines.push(`    </adr>`);
  });

  c.url?.forEach((u) => {
    if (!u.value) return;
    const params = u.type ? { type: [u.type.toLowerCase()] } : {};
    lines.push(prop("url", params, "uri", u.value));
  });

  c.lang?.forEach((l) => {
    if (!l.value) return;
    const params = l.pref ? { pref: l.pref } : {};
    lines.push(prop("lang", params, "language-tag", l.value));
  });

  c.impp?.forEach((i) => {
    if (!i.value) return;
    const params = i.type ? { type: [i.type.toLowerCase()] } : {};
    lines.push(prop("impp", params, "uri", i.value));
  });

  c.related?.forEach((r) => {
    if (!r.value) return;
    const params = r.type ? { type: [r.type.toLowerCase()] } : {};
    lines.push(prop("related", params, "text", r.value));
  });

  if (c.kind === "group") {
    c.members?.forEach((m) => {
      if (!m.value) return;
      const uri =
        m.type === "email" ? `mailto:${m.value}` : `urn:uuid:${m.value}`;
      lines.push(prop("member", {}, "uri", uri));
    });
  }

  lines.push("  </vcard>");
  return lines.join("\n");
}

export function toXCard(contacts) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<vcards xmlns="${XCARD_NS}">`,
    ...contacts.map(contactToXCard),
    "</vcards>",
  ];
  return lines.join("\n");
}

// ─── CSV (format Google Contacts) ────────────────────────────────────────────

export function toCSV(contacts) {
  const headers = [
    "Name",
    "Given Name",
    "Additional Name",
    "Family Name",
    "Name Prefix",
    "Name Suffix",
    "Organization 1 - Name",
    "Organization 1 - Title",
    "Organization 1 - Department",
    "Nickname",
    "Birthday",
    "Gender",
    "Notes",
    "Phone 1 - Type",
    "Phone 1 - Value",
    "Phone 2 - Type",
    "Phone 2 - Value",
    "Phone 3 - Type",
    "Phone 3 - Value",
    "E-mail 1 - Type",
    "E-mail 1 - Value",
    "E-mail 2 - Type",
    "E-mail 2 - Value",
    "Address 1 - Type",
    "Address 1 - Street",
    "Address 1 - City",
    "Address 1 - Region",
    "Address 1 - Postal Code",
    "Address 1 - Country",
    "Address 2 - Type",
    "Address 2 - Street",
    "Address 2 - City",
    "Address 2 - Region",
    "Address 2 - Postal Code",
    "Address 2 - Country",
    "Website 1 - Type",
    "Website 1 - Value",
    "Website 2 - Type",
    "Website 2 - Value",
  ];

  const csvEsc = (val) => {
    const s = String(val || "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = contacts.map((c) =>
    [
      c.fn,
      c.firstName,
      c.middleName,
      c.lastName,
      c.prefix,
      c.suffix,
      c.org,
      c.title,
      "",
      c.nickname,
      c.bday,
      c.gender,
      c.note,
      c.tel?.[0]?.type || "",
      c.tel?.[0]?.value || "",
      c.tel?.[1]?.type || "",
      c.tel?.[1]?.value || "",
      c.tel?.[2]?.type || "",
      c.tel?.[2]?.value || "",
      c.email?.[0]?.type || "",
      c.email?.[0]?.value || "",
      c.email?.[1]?.type || "",
      c.email?.[1]?.value || "",
      c.adr?.[0]?.type || "",
      c.adr?.[0]?.raw?.[2] || "",
      c.adr?.[0]?.raw?.[3] || "",
      c.adr?.[0]?.raw?.[4] || "",
      c.adr?.[0]?.raw?.[5] || "",
      c.adr?.[0]?.raw?.[6] || "",
      c.adr?.[1]?.type || "",
      c.adr?.[1]?.raw?.[2] || "",
      c.adr?.[1]?.raw?.[3] || "",
      c.adr?.[1]?.raw?.[4] || "",
      c.adr?.[1]?.raw?.[5] || "",
      c.adr?.[1]?.raw?.[6] || "",
      c.url?.[0]?.type || "",
      c.url?.[0]?.value || "",
      c.url?.[1]?.type || "",
      c.url?.[1]?.value || "",
    ]
      .map(csvEsc)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

export function sanitizeFilename(name) {
  return (
    (name || "contact").replace(/[^a-zA-Z0-9_\-. ]/g, "_").trim() || "contact"
  );
}
