import { splitAndParse } from "./vcard";

// ─── jCard ───────────────────────────────────────────────────────────────────
function jCardPropToField(props) {
  const get = (name) => props.find((p) => p[0] === name);
  const getAll = (name) => props.filter((p) => p[0] === name);

  const n = get("n")?.[3] || [];
  const tels = getAll("tel").map((p) => {
    const typeRaw = p[1]?.type;
    const type = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw || "voice";
    return {
      type,
      value: (p[3] || "").replace("tel:", ""),
    };
  });
  const emails = getAll("email").map((p) => {
    const typeRaw = p[1]?.type;
    const type = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw || "internet";
    return {
      type,
      value: p[3] || "",
    };
  });
  const adrs = getAll("adr").map((p) => {
    const typeRaw = p[1]?.type;
    const type = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw || "home";
    return {
      type,
      raw: Array.isArray(p[3]) ? p[3] : ["", "", "", "", "", "", ""],
      value: Array.isArray(p[3]) ? p[3].filter(Boolean).join(", ") : "",
    };
  });
  const urls = getAll("url").map((p) => {
    const typeRaw = p[1]?.type;
    const type = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw || "home";
    return {
      type,
      value: p[3] || "",
    };
  });
  const langs = getAll("lang").map((p) => ({
    pref: p[1]?.pref || "",
    value: p[3] || "",
  }));
  const impp = getAll("impp").map((p) => ({
    type: p[1]?.type?.[0] || "",
    value: p[3] || "",
  }));
  const related = getAll("related").map((p) => ({
    type: p[1]?.type?.[0] || "",
    value: p[3] || "",
  }));
  const members = getAll("member").map((p) => {
    const val = p[3] || "";
    if (val.startsWith("mailto:"))
      return { type: "email", value: val.replace("mailto:", "") };
    if (val.startsWith("urn:uuid:"))
      return { type: "uid", value: val.replace("urn:uuid:", "") };
    return { type: "unknown", value: val };
  });

  return {
    fn: get("fn")?.[3] || "",
    firstName: n[1] || "",
    lastName: n[0] || "",
    middleName: n[2] || "",
    prefix: n[3] || "",
    suffix: n[4] || "",
    org: get("org")?.[3] || "",
    title: get("title")?.[3] || "",
    role: get("role")?.[3] || "",
    nickname: get("nickname")?.[3] || "",
    bday: get("bday")?.[3] || "",
    anniversary: get("anniversary")?.[3] || "",
    gender: get("gender")?.[3] || "",
    note: get("note")?.[3] || "",
    geo: get("geo")?.[3] || "",
    tz: get("tz")?.[3] || "",
    uid: (get("uid")?.[3] || "").replace("urn:uuid:", ""),
    rev: get("rev")?.[3] || "",
    kind: get("kind")?.[3] || "individual",
    categories: get("categories")?.[3] || "",
    tel: tels,
    email: emails,
    adr: adrs,
    url: urls,
    lang: langs,
    impp,
    related,
    members,
    photo: null,
    logo: null,
    sound: null,
  };
}

export function fromJCard(jsonStr) {
  const data = JSON.parse(jsonStr);

  // Cas 1: un seul jCard ["vcard", [...]]
  if (data[0] === "vcard") {
    return [{ id: 0, ...jCardPropToField(data[1]) }];
  }

  // Cas 2: tableau de jCards [["vcard", [...]], ["vcard", [...]]]
  if (Array.isArray(data) && data[0]?.[0] === "vcard") {
    return data.map((card, i) => ({ id: i, ...jCardPropToField(card[1]) }));
  }

  return [];
}

// ─── xCard ───────────────────────────────────────────────────────────────────
export function fromXCard(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, "application/xml");
  const vcards = Array.from(doc.querySelectorAll("vcard"));

  const getText = (el, tag) => el.querySelector(tag)?.textContent?.trim() || "";
  const getAll = (el, tag) => Array.from(el.querySelectorAll(tag));

  return vcards.map((vcard, i) => {
    const tels = getAll(vcard, "tel").map((el) => ({
      type: el.querySelector("type text")?.textContent || "voice",
      value: el.querySelector("uri")?.textContent?.replace("tel:", "") || "",
    }));
    const emails = getAll(vcard, "email").map((el) => ({
      type: el.querySelector("type text")?.textContent || "internet",
      value: el.querySelector("text")?.textContent || "",
    }));
    const adrs = getAll(vcard, "adr").map((el) => {
      const raw = [
        getText(el, "pobox"),
        getText(el, "ext"),
        getText(el, "street"),
        getText(el, "locality"),
        getText(el, "region"),
        getText(el, "code"),
        getText(el, "country"),
      ];
      return {
        type: el.querySelector("type text")?.textContent || "home",
        raw,
        value: raw.filter(Boolean).join(", "),
      };
    });
    const urls = getAll(vcard, "url").map((el) => ({
      type: el.querySelector("type text")?.textContent || "home",
      value: el.querySelector("uri")?.textContent || "",
    }));
    const members = getAll(vcard, "member").map((el) => {
      const val = el.querySelector("uri")?.textContent || "";
      if (val.startsWith("mailto:"))
        return { type: "email", value: val.replace("mailto:", "") };
      if (val.startsWith("urn:uuid:"))
        return { type: "uid", value: val.replace("urn:uuid:", "") };
      return { type: "unknown", value: val };
    });

    return {
      id: i,
      fn: getText(vcard, "fn text"),
      firstName: getText(vcard, "n given"),
      lastName: getText(vcard, "n surname"),
      middleName: getText(vcard, "n additional"),
      prefix: getText(vcard, "n prefix"),
      suffix: getText(vcard, "n suffix"),
      org: getText(vcard, "org text"),
      title: getText(vcard, "title text"),
      role: getText(vcard, "role text"),
      nickname: getText(vcard, "nickname text"),
      bday: getText(vcard, "bday date"),
      anniversary: getText(vcard, "anniversary date"),
      gender: getText(vcard, "gender sex"),
      note: getText(vcard, "note text"),
      geo: getText(vcard, "geo uri"),
      tz: getText(vcard, "tz text"),
      uid: getText(vcard, "uid uri").replace("urn:uuid:", ""),
      rev: getText(vcard, "rev timestamp"),
      kind: getText(vcard, "kind text") || "individual",
      categories: getText(vcard, "categories text"),
      tel: tels,
      email: emails,
      adr: adrs,
      url: urls,
      lang: [],
      impp: [],
      related: [],
      members,
      photo: null,
      logo: null,
      sound: null,
    };
  });
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
export function fromCSV(csvStr) {
  const lines = csvStr.split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  };

  const headers = parseRow(lines[0]);
  const idx = (name) => headers.indexOf(name);

  return lines.slice(1).map((line, i) => {
    const cols = parseRow(line);
    const g = (name) => cols[idx(name)]?.trim() || "";

    const tel = [];
    for (let n = 1; n <= 3; n++) {
      const val = g(`Phone ${n} - Value`);
      if (val)
        tel.push({ type: g(`Phone ${n} - Type`) || "voice", value: val });
    }
    const email = [];
    for (let n = 1; n <= 2; n++) {
      const val = g(`E-mail ${n} - Value`);
      if (val)
        email.push({ type: g(`E-mail ${n} - Type`) || "internet", value: val });
    }
    const adr = [];
    for (let n = 1; n <= 2; n++) {
      const street = g(`Address ${n} - Street`);
      if (street) {
        const raw = [
          "",
          "",
          street,
          g(`Address ${n} - City`),
          g(`Address ${n} - Region`),
          g(`Address ${n} - Postal Code`),
          g(`Address ${n} - Country`),
        ];
        adr.push({
          type: g(`Address ${n} - Type`) || "home",
          raw,
          value: raw.filter(Boolean).join(", "),
        });
      }
    }
    const url = [];
    for (let n = 1; n <= 2; n++) {
      const val = g(`Website ${n} - Value`);
      if (val)
        url.push({ type: g(`Website ${n} - Type`) || "home", value: val });
    }

    const firstName = g("Given Name");
    const lastName = g("Family Name");
    const fn =
      g("Name") ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      `Contact ${i + 1}`;

    return {
      id: i,
      fn,
      firstName,
      lastName,
      middleName: g("Additional Name"),
      prefix: g("Name Prefix"),
      suffix: g("Name Suffix"),
      org: g("Organization 1 - Name"),
      title: g("Organization 1 - Title"),
      role: "",
      nickname: g("Nickname"),
      bday: g("Birthday"),
      anniversary: "",
      gender: g("Gender"),
      note: g("Notes"),
      geo: "",
      tz: "",
      uid: "",
      rev: "",
      kind: "individual",
      categories: "",
      tel,
      email,
      adr,
      url,
      lang: [],
      impp: [],
      related: [],
      members: [],
      photo: null,
      logo: null,
      sound: null,
    };
  });
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
export function parseImportFile(content, ext) {
  switch (ext) {
    case ".json":
      return fromJCard(content);
    case ".xml":
      return fromXCard(content);
    case ".csv":
      return fromCSV(content);
    case ".vcf":
    default:
      return splitAndParse(content);
  }
}
