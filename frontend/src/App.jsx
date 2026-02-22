import { useState } from "react";
import {
  Layout,
  List,
  Input,
  Button,
  Avatar,
  Typography,
  Tag,
  Empty,
  Divider,
} from "antd";
import {
  UserOutlined,
  FolderOpenOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import vCard from "vcard-parser";
import { OpenVCardFile } from "../wailsjs/go/main/App";
import "antd/dist/reset.css";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
import quotedPrintable from "quoted-printable";
import utf8 from "utf8";

// Extraire et normaliser la photo en data URL utilisable dans <img src="...">
function getPhoto(card) {
  try {
    console.log("PHOTO raw:", JSON.stringify(card.photo, null, 2));
    const prop = card.photo?.[0];
    if (!prop) return null;

    const value = prop.value || "";
    const meta = prop.meta || {};

    const encoding = (
      meta.encoding?.[0] ||
      meta.ENCODING?.[0] ||
      ""
    ).toLowerCase();
    const type = (meta.type?.[0] || meta.TYPE?.[0] || "jpeg").toLowerCase();
    const valueParam = (meta.value?.[0] || meta.VALUE?.[0] || "").toLowerCase();

    // --- CAS 1 : data URI déjà formé (vCard 4.0) ---
    if (typeof value === "string" && value.startsWith("data:")) {
      return value;
    }

    // --- CAS 2 : ENCODING=BASE64 ou b (vCard 2.1 / 3.0) ---
    if (encoding === "base64" || encoding === "b") {
      const cleaned = value.replace(/\s+/g, "");
      if (!cleaned) return null;
      const mimeType = type === "jpg" ? "jpeg" : type;
      return `data:image/${mimeType};base64,${cleaned}`;
    }

    // --- CAS 3 : URL externe accessible publiquement ---
    if (
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"))
    ) {
      // Rejeter les URLs privées connues (iCloud, etc.)
      const privateHosts = [
        "icloud.com",
        "p18-contacts.icloud.com",
        "contacts.icloud.com",
        "me.com",
      ];
      const isPrivate = privateHosts.some((host) => value.includes(host));
      if (isPrivate) return null; // ← on ignore silencieusement

      return value;
    }

    // --- CAS 4 : VALUE=URI avec URL ---
    if (
      valueParam === "uri" &&
      typeof value === "string" &&
      value.startsWith("http")
    ) {
      const privateHosts = ["icloud.com", "me.com"];
      const isPrivate = privateHosts.some((host) => value.includes(host));
      if (isPrivate) return null;
      return value;
    }

    // --- CAS 5 : fallback base64 brut ---
    if (
      typeof value === "string" &&
      value.length > 100 &&
      /^[A-Za-z0-9+/=\s]+$/.test(value)
    ) {
      const cleaned = value.replace(/\s+/g, "");
      const mimeType = type === "jpg" ? "jpeg" : type || "jpeg";
      return `data:image/${mimeType};base64,${cleaned}`;
    }

    return null;
  } catch (e) {
    console.warn("Erreur getPhoto:", e);
    return null; // jamais de crash — on retourne null silencieusement
  }
}

function decodeQP(value, meta) {
  try {
    const encoding = meta?.encoding?.[0] || meta?.ENCODING?.[0] || "";
    const charset = meta?.charset?.[0] || meta?.CHARSET?.[0] || "UTF-8";

    if (encoding.toUpperCase() !== "QUOTED-PRINTABLE") return value;

    // Rejoindre les soft line breaks (= en fin de ligne)
    const joined = value.replace(/=\r\n/g, "").replace(/=\n/g, "");

    const decoded = quotedPrintable.decode(joined);

    // Décoder selon le charset
    if (charset.toUpperCase() === "UTF-8") {
      return utf8.decode(decoded);
    }
    return decoded;
  } catch (e) {
    console.warn("Erreur QP decode:", e);
    return value;
  }
}

// Helper pour extraire une valeur string d'un champ, avec décodage QP
function getStr(card, field) {
  const prop = card[field]?.[0];
  if (!prop) return "";
  const val = Array.isArray(prop.value)
    ? prop.value.filter(Boolean).join(" ")
    : prop.value || "";
  return decodeQP(val, prop.meta);
}

// Helper pour extraire tous les champs d'un type (TEL, EMAIL, ADR...)
function getAll(card, field) {
  const props = card[field] || [];
  return props.map((p) => {
    const type = p.meta?.type?.[0] || p.meta?.TYPE?.[0] || field;

    if (Array.isArray(p.value)) {
      return {
        type,
        value: p.value.map((part) => decodeQP(part || "", p.meta)),
        raw: p.value,
      };
    }

    // ← si value est une string, on la met dans un tableau
    return {
      type,
      value: decodeQP(p.value || "", p.meta),
      raw: typeof p.value === "string" ? p.value.split(";") : [],
    };
  });
}
// vcard-parser retourne un objet pour UNE seule vCard
// Pour plusieurs vCards dans un fichier, on doit splitter manuellement
function splitAndParse(raw) {
  // Unfold les lignes repliées (ligne suivante commence par espace)
  const unfolded = raw.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");

  // Extraire chaque bloc BEGIN:VCARD...END:VCARD
  const blocks = [];
  const regex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
  let match;
  while ((match = regex.exec(unfolded)) !== null) {
    blocks.push(match[0]);
  }

  return blocks.map((block, i) => {
    try {
      const card = vCard.parse(block);

      const nParts = (card.n?.[0]?.value || []).map((part, i) =>
        decodeQP(part, card.n[0].meta),
      );

      return {
        id: i,
        fn: getStr(card, "fn") || `Contact ${i + 1}`,
        firstName: nParts[1] || "",
        lastName: nParts[0] || "",
        middleName: nParts[2] || "",
        prefix: nParts[3] || "",
        suffix: nParts[4] || "",
        org: getStr(card, "org"),
        title: getStr(card, "title"),
        tel: getAll(card, "tel"),
        email: getAll(card, "email"),
        adr: getAll(card, "adr"),
        note: getStr(card, "note"),
        url: getStr(card, "url"),
        bday: getStr(card, "bday"),
        photo: getPhoto(card),
        gender: getStr(card, "gender"),
        tz: getStr(card, "tz"),
      };
    } catch (e) {
      console.error(`Erreur parsing contact ${i}:`, e);
      return {
        id: i,
        fn: `Contact ${i + 1} (erreur)`,
        tel: [],
        email: [],
        adr: [],
      };
    }
  });
}

const TYPE_COLORS = {
  home: "blue",
  work: "green",
  cell: "purple",
  postal: "orange",
  parcel: "cyan",
  voice: "geekblue",
};

function typeColor(type) {
  return TYPE_COLORS[type?.toLowerCase()] || "default";
}

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const handleOpen = async () => {
    setError("");
    try {
      const raw = await OpenVCardFile();
      if (!raw) return;
      const parsed = splitAndParse(raw);
      setContacts(parsed);
      setSelected(parsed[0] || null);
    } catch (e) {
      setError("Erreur : " + e.message);
      console.error(e);
    }
  };

  const filtered = contacts.filter(
    (c) =>
      c.fn.toLowerCase().includes(search.toLowerCase()) ||
      c.org?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Sidebar */}
      <Sider
        width={260}
        theme="light"
        style={{ borderRight: "1px solid #f0f0f0", overflow: "auto" }}
      >
        <div style={{ padding: 12 }}>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleOpen}
            block
            type="primary"
            style={{ marginBottom: 10 }}
          >
            Ouvrir .vcf
          </Button>
          <Input.Search
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 6 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </Text>
        </div>

        {error && (
          <Text type="danger" style={{ padding: "0 12px", display: "block" }}>
            {error}
          </Text>
        )}

        {contacts.length === 0 ? (
          <Empty description="Aucun contact" style={{ marginTop: 40 }} />
        ) : (
          <List
            dataSource={filtered}
            renderItem={(c) => (
              <List.Item
                onClick={() => setSelected(c)}
                style={{
                  padding: "6px 12px",
                  cursor: "pointer",
                  background: selected?.id === c.id ? "#e6f4ff" : "transparent",
                  borderLeft:
                    selected?.id === c.id
                      ? "3px solid #1677ff"
                      : "3px solid transparent",
                  borderBottom: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar
                    size={28}
                    src={c.photo || undefined}
                    icon={!c.photo && <UserOutlined />}
                    style={{
                      backgroundColor: c.photo ? "transparent" : "#1677ff",
                      flexShrink: 0,
                    }}
                    onError={() => true} // ← empêche Ant Design de logger une erreur
                  />
                  <div style={{ textAlign: "left", overflow: "hidden" }}>
                    <Text
                      strong={selected?.id === c.id}
                      style={{ fontSize: 13, lineHeight: "1.2" }}
                    >
                      {c.fn}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Sider>

      {/* Panneau de détail */}
      <Content style={{ padding: 32, overflow: "auto", background: "#fff" }}>
        {selected ? (
          <ContactDetail contact={selected} />
        ) : (
          <Empty
            description="Ouvre un fichier .vcf et sélectionne un contact"
            style={{ marginTop: 100 }}
          />
        )}
      </Content>
    </Layout>
  );
}

function ContactDetail({ contact }) {
  // Formater l'adresse depuis les parties ADR
  function formatAdr(parts) {
    // Sécurité — si parts n'est pas un tableau, on retourne la valeur brute
    if (!parts) return "";
    if (!Array.isArray(parts)) return String(parts);

    // [pobox, ext, street, city, state, zip, country]
    const [, , street, city, state, zip, country] = parts;
    return [street, city, state, zip, country].filter(Boolean).join(", ");
  }

  return (
    <div style={{ maxWidth: 650 }}>
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Avatar
          size={80}
          src={contact.photo || undefined}
          icon={!contact.photo && <UserOutlined />}
          style={{
            backgroundColor: contact.photo ? "transparent" : "#1677ff",
            flexShrink: 0,
          }}
          onError={() => true}
        />
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {contact.fn}
          </Title>
          {contact.prefix && <Tag>{contact.prefix}</Tag>}
          {contact.suffix && <Tag>{contact.suffix}</Tag>}
          {contact.org && (
            <div>
              <Text type="secondary">{contact.org}</Text>
            </div>
          )}
          {contact.title && (
            <div>
              <Text type="secondary">{contact.title}</Text>
            </div>
          )}
          {contact.gender && (
            <Tag style={{ marginTop: 4 }}>
              {contact.gender === "M"
                ? "♂ Homme"
                : contact.gender === "F"
                  ? "♀ Femme"
                  : contact.gender}
            </Tag>
          )}
        </div>
      </div>

      <Divider />

      {/* Téléphones */}
      {contact.tel.length > 0 && (
        <Section icon={<PhoneOutlined />} title="Téléphone">
          {contact.tel.map((t, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <Tag color={typeColor(t.type)}>{t.type}</Tag>
              <Text>{t.value}</Text>
            </div>
          ))}
        </Section>
      )}

      {/* Emails */}
      {contact.email.length > 0 && (
        <Section icon={<MailOutlined />} title="Email">
          {contact.email.map((e, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <Tag color={typeColor(e.type)}>{e.type}</Tag>
              <Text>{e.value}</Text>
            </div>
          ))}
        </Section>
      )}

      {/* Adresses */}
      {contact.adr.length > 0 && (
        <Section icon={<HomeOutlined />} title="Adresse">
          {contact.adr.map((a, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <Tag color={typeColor(a.type)}>{a.type}</Tag>
              <Text>{Array.isArray(a.raw) ? formatAdr(a.raw) : a.value}</Text>
            </div>
          ))}
        </Section>
      )}

      {/* Infos supplémentaires */}
      {(contact.bday || contact.tz || contact.url || contact.note) && (
        <>
          <Divider />
          {contact.bday && (
            <InfoRow label="Date de naissance" value={contact.bday} />
          )}
          {contact.tz && <InfoRow label="Fuseau horaire" value={contact.tz} />}
          {contact.url && (
            <InfoRow
              label="Site web"
              value={
                <a href={contact.url} target="_blank" rel="noreferrer">
                  <GlobalOutlined /> {contact.url}
                </a>
              }
            />
          )}
          {contact.note && <InfoRow label="Note" value={contact.note} />}
        </>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Text
        strong
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          color: "#555",
        }}
      >
        {icon} {title}
      </Text>
      <div style={{ paddingLeft: 20 }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary">{label} : </Text>
      <Text>{value}</Text>
    </div>
  );
}
