import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react";
import {
  Tabs,
  Input,
  Button,
  Avatar,
  DatePicker,
  Typography,
  Card,
  Select,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CameraOutlined,
  DownloadOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import {
  OpenImageFile,
  OpenSoundFile,
  SaveContactPhoto,
} from "../../wailsjs/go/main/App";

import AddressDialog from "./AddressDialog";

const { Text } = Typography;

const TEL_TYPES = ["Cell", "Home", "Work", "Fax", "Voice", "Pager"];
const URL_TYPES = [
  "Home",
  "Work",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Twitter",
];

const cardStyle = { marginBottom: 10, borderColor: "#bbb" };
const headStyle = {
  backgroundColor: "#f0f0f0",
  borderBottom: "1px solid #bbb",
};

// Composant réutilisable pour une ligne label + input inline
function InlineField({ label, children, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, ...style }}>
      <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
        {label}
      </Text>
      {children}
    </div>
  );
}

// Composant réutilisable pour les listes téléphone/URL
function ItemList({
  items,
  typeOptions,
  onAdd,
  onRemove,
  onChange,
  title,
  style,
}) {
  const { t } = useTranslation();
  return (
    <Card
      size="small"
      title={
        <Text strong style={{ fontSize: 12 }}>
          {title}
        </Text>
      }
      extra={
        <Button
          size="small"
          icon={<PlusOutlined />}
          type="text"
          onClick={onAdd}
        />
      }
      style={{ ...cardStyle, ...style }}
      headStyle={headStyle}
    >
      {items.length === 0 && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t("contact.no_element")}
        </Text>
      )}
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <select
            value={item.type}
            onChange={(e) => onChange(i, "type", e.target.value)}
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              padding: "3px 6px",
              fontSize: 12,
              color: "#555",
              background: "#fafafa",
            }}
          >
            {typeOptions.map((t) => (
              <option key={t} value={t.toLowerCase()}>
                {t}
              </option>
            ))}
          </select>
          <Input
            size="small"
            value={item.value}
            onChange={(e) => onChange(i, "value", e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemove(i)}
          />
        </div>
      ))}
    </Card>
  );
}

export default function ContactDetail({ contact, onSave, onDirtyChange }) {
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [adrDialogOpen, setAdrDialogOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);

  const { t } = useTranslation();
  useEffect(() => {
    if (!contact) return;
    setForm({
      fn: contact.fn || "",
      firstName: contact.firstName || "",
      middleName: contact.middleName || "",
      lastName: contact.lastName || "",
      prefix: contact.prefix || "",
      suffix: contact.suffix || "",
      bday: contact.bday || "",
      photo: contact.photo || null,
      adr: contact.adr.map((a) => ({ ...a })),
      tel: contact.tel.map((t) => ({ ...t })),
      email: contact.email.map((e) => ({ ...e })),
      url: contact.url || [],
      org: contact.org || "",
      title: contact.title || "",
      note: contact.note || "",
      gender: contact.gender || "",
      tz: contact.tz || "",
      sound: contact.sound || null,
      nickname: contact.nickname || "",
      anniversary: contact.anniversary || "",
      role: contact.role || "",
      categories: contact.categories || "",
      geo: contact.geo || "",
      rev: contact.rev || "",
      uid: contact.uid || "",
      kind: contact.kind || "",
      members: contact.members || [],
      lang: contact.lang || [],
      impp: contact.impp || [],
      related: contact.related || [],
      logo: contact.logo || null,
    });
    setDirty(false);
    onDirtyChange?.(false);
  }, [contact]);

  if (!form) return null;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    onDirtyChange?.(true);
  };

  const handleSave = () => {
    onSave({ ...contact, ...form });
    setDirty(false);
    onDirtyChange?.(false);
  };

  // Adresses
  const addAddress = ({ types }) => {
    update("adr", [
      ...form.adr,
      {
        type: types[0],
        value: ["", "", "", "", "", "", ""],
        raw: ["", "", "", "", "", "", ""],
      },
    ]);
    setAdrDialogOpen(false);
  };
  const removeAddress = (i) =>
    update(
      "adr",
      form.adr.filter((_, idx) => idx !== i),
    );
  const updateAdrPart = (adrIdx, partIdx, value) => {
    update(
      "adr",
      form.adr.map((a, i) => {
        if (i !== adrIdx) return a;
        const newRaw = [...(a.raw || ["", "", "", "", "", "", ""])];
        newRaw[partIdx] = value;
        return { ...a, raw: newRaw, value: newRaw };
      }),
    );
  };

  // Téléphones
  const addTel = () =>
    update("tel", [...form.tel, { type: "cell", value: "" }]);
  const removeTel = (i) =>
    update(
      "tel",
      form.tel.filter((_, idx) => idx !== i),
    );
  const updateTel = (i, field, value) =>
    update(
      "tel",
      form.tel.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)),
    );

  // URLs
  const addUrl = () =>
    update("url", [...form.url, { type: "home", value: "" }]);
  const removeUrl = (i) =>
    update(
      "url",
      form.url.filter((_, idx) => idx !== i),
    );
  const updateUrl = (i, field, value) =>
    update(
      "url",
      form.url.map((u, idx) => (idx === i ? { ...u, [field]: value } : u)),
    );

  const mainTab = (
    <div>
      {/* Name */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("contact.name")}
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
              <InlineField label="Title">
                <Input
                  size="small"
                  value={form.prefix}
                  onChange={(e) => update("prefix", e.target.value)}
                  style={{ width: 70 }}
                />
              </InlineField>
              <InlineField label="Full" style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={form.fn}
                  onChange={(e) => update("fn", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
              <InlineField label="First" style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
              <InlineField label="Middle" style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={form.middleName}
                  onChange={(e) => update("middleName", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
              <InlineField label="Last" style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
            </div>
            <InlineField label="Birthdate">
              <DatePicker
                size="small"
                format={["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]}
                value={
                  form.bday
                    ? dayjs(form.bday, ["YYYY-MM-DD", "YYYYMMDD", "--MM-DD"])
                    : null
                }
                onChange={(_, dateString) => update("bday", dateString || "")}
                inputReadOnly={false}
                placeholder="YYYY-MM-DD"
              />
            </InlineField>
          </div>

          {/* Photo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Avatar
              size={100}
              src={form.photo || undefined}
              icon={!form.photo && <UserOutlined />}
              style={{
                backgroundColor: form.photo ? "transparent" : "#1677ff",
              }}
            />

            <div style={{ display: "flex", gap: 4 }}>
              <Button
                size="small"
                icon={<CameraOutlined />}
                type="text"
                onClick={async () => {
                  try {
                    const dataUrl = await OpenImageFile();
                    if (dataUrl) update("photo", dataUrl);
                  } catch (e) {
                    console.error("Erreur photo:", e);
                  }
                }}
              />
              {form.photo && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  type="text"
                  onClick={async () => {
                    try {
                      await SaveContactPhoto(form.photo, form.fn || "contact");
                    } catch (e) {
                      console.error("Erreur photo:", e);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Address */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("contact.address")}
          </Text>
        }
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            type="text"
            onClick={() => setAdrDialogOpen(true)}
          />
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        {form.adr.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("contact.no_address")}
          </Text>
        ) : (
          <Tabs
            size="small"
            type="editable-card"
            hideAdd
            onEdit={(key, action) => {
              if (action === "remove") removeAddress(parseInt(key));
            }}
            items={form.adr.map((a, i) => ({
              key: String(i),
              label: a.type || "Adresse",
              closable: true,
              children: (
                <div style={{ padding: "4px 0" }}>
                  <InlineField label="Addres" style={{ marginBottom: 6 }}>
                    <Input
                      size="small"
                      value={a.raw?.[2] || ""}
                      onChange={(e) => updateAdrPart(i, 2, e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </InlineField>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <InlineField label="Ext" style={{ flex: 1 }}>
                      <Input
                        size="small"
                        value={a.raw?.[1] || ""}
                        onChange={(e) => updateAdrPart(i, 1, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </InlineField>
                    <InlineField label="City" style={{ flex: 1 }}>
                      <Input
                        size="small"
                        value={a.raw?.[3] || ""}
                        onChange={(e) => updateAdrPart(i, 3, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </InlineField>
                    <InlineField label="Region" style={{ flex: 1 }}>
                      <Input
                        size="small"
                        value={a.raw?.[4] || ""}
                        onChange={(e) => updateAdrPart(i, 4, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </InlineField>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <InlineField label="Zip" style={{ flex: 1 }}>
                      <Input
                        size="small"
                        value={a.raw?.[5] || ""}
                        onChange={(e) => updateAdrPart(i, 5, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </InlineField>
                    <InlineField label="PO" style={{ flex: 1 }}>
                      <Input
                        size="small"
                        value={a.raw?.[0] || ""}
                        onChange={(e) => updateAdrPart(i, 0, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </InlineField>
                    <InlineField label="Country" style={{ flex: 1 }}>
                      <Input
                        size="small"
                        value={a.raw?.[6] || ""}
                        onChange={(e) => updateAdrPart(i, 6, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </InlineField>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Card>

      {/* Phones & Email & Web */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <ItemList
            title={t("contact.phones")}
            items={form.tel}
            typeOptions={TEL_TYPES}
            onAdd={addTel}
            onRemove={removeTel}
            onChange={updateTel}
          />
        </div>
        <div style={{ flex: 1 }}>
          <ItemList
            title={t("contact.emails")}
            items={form.email}
            typeOptions={["Home", "Work", "Internet", "Pref"]}
            onAdd={() =>
              update("email", [...form.email, { type: "internet", value: "" }])
            }
            onRemove={(i) =>
              update(
                "email",
                form.email.filter((_, idx) => idx !== i),
              )
            }
            onChange={(i, field, value) =>
              update(
                "email",
                form.email.map((e, idx) =>
                  idx === i ? { ...e, [field]: value } : e,
                ),
              )
            }
          />
        </div>
        <div style={{ flex: 1 }}>
          <ItemList
            title="Web"
            items={form.url}
            typeOptions={URL_TYPES}
            onAdd={addUrl}
            onRemove={removeUrl}
            onChange={updateUrl}
          />
        </div>
      </div>
    </div>
  );

  const extraTab = (
    <div>
      {/* Groupbox Identité */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("contact.identity")}
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Champs gauche */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
              <InlineField label="Org" style={{ flex: 2 }}>
                <Input
                  size="small"
                  value={form.org}
                  onChange={(e) => update("org", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
              <InlineField label="Role" style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
              <InlineField label="Title" style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
              <InlineField label="Nickname" style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={form.nickname}
                  onChange={(e) => update("nickname", e.target.value)}
                  style={{ flex: 1 }}
                />
              </InlineField>
            </div>
          </div>

          {/* Logo organisation */}
          <div
            style={{
              flexShrink: 0,
              width: 64,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            {form.logo ? (
              <img
                src={form.logo}
                alt="logo"
                style={{
                  width: 56,
                  height: 56,
                  objectFit: "contain",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 6,
                  border: "1px dashed #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fafafa",
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 10, textAlign: "center" }}
                >
                  Logo
                </Text>
              </div>
            )}
            <div style={{ display: "flex", gap: 2 }}>
              <Button
                size="small"
                icon={<CameraOutlined />}
                type="text"
                onClick={async () => {
                  try {
                    const dataUrl = await OpenImageFile();
                    if (dataUrl) update("logo", dataUrl);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
              {form.logo && (
                <>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    type="text"
                    onClick={async () => {
                      try {
                        await SaveContactPhoto(
                          form.logo,
                          (form.org || "logo") + "_logo",
                        );
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  />
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    onClick={() => update("logo", null)}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kind */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
            marginTop: 8,
            alignItems: "center",
          }}
        >
          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
            Kind
          </Text>
          <Select
            size="small"
            value={form.kind || "individual"}
            onChange={(v) => update("kind", v)}
            options={[
              { value: "individual", label: "Individual" },
              { value: "group", label: "Group" },
              { value: "organization", label: "Organization" },
              { value: "location", label: "Location" },
            ]}
            style={{ width: 130 }}
          />
        </div>

        {/* Members — visible seulement si kind=group */}
        {form.kind === "group" && (
          <Card
            size="small"
            title={
              <Text strong style={{ fontSize: 12 }}>
                Members
              </Text>
            }
            extra={
              <Button
                size="small"
                icon={<PlusOutlined />}
                type="text"
                onClick={() =>
                  update("members", [
                    ...(form.members || []),
                    { type: "email", value: "" },
                  ])
                }
              />
            }
            style={cardStyle}
            headStyle={headStyle}
          >
            {(form.members || []).length === 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Aucun membre
              </Text>
            )}
            {(form.members || []).map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 6,
                  alignItems: "center",
                }}
              >
                <Select
                  size="small"
                  value={m.type}
                  onChange={(v) =>
                    update(
                      "members",
                      form.members.map((x, idx) =>
                        idx === i ? { ...x, type: v } : x,
                      ),
                    )
                  }
                  options={[
                    { value: "email", label: "📧 mailto" },
                    { value: "uid", label: "🔑 urn:uuid" },
                  ]}
                  style={{ width: 110 }}
                />
                <Input
                  size="small"
                  value={m.value}
                  placeholder={
                    m.type === "email" ? "john@example.com" : "uuid..."
                  }
                  onChange={(e) =>
                    update(
                      "members",
                      form.members.map((x, idx) =>
                        idx === i ? { ...x, value: e.target.value } : x,
                      ),
                    )
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    update(
                      "members",
                      form.members.filter((_, idx) => idx !== i),
                    )
                  }
                />
              </div>
            ))}
          </Card>
        )}

        {/* Gender + Categories */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <InlineField label="Gender" style={{ flex: 1 }}>
            <Input
              size="small"
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              style={{ flex: 1 }}
            />
          </InlineField>
          <InlineField label="Categories" style={{ flex: 2 }}>
            <Input
              size="small"
              value={form.categories}
              onChange={(e) => update("categories", e.target.value)}
              style={{ flex: 1 }}
            />
          </InlineField>
        </div>
      </Card>

      {/* Dates + Localisation côte à côte */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Card
          size="small"
          title={
            <Text strong style={{ fontSize: 12 }}>
              {t("contact.dates")}
            </Text>
          }
          style={{ ...cardStyle, flex: 1, marginBottom: 0 }}
          headStyle={headStyle}
        >
          <InlineField label="Anniv.">
            <DatePicker
              size="small"
              format={["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]}
              value={
                form.anniversary
                  ? dayjs(form.anniversary, ["YYYY-MM-DD", "YYYYMMDD"])
                  : null
              }
              onChange={(_, dateString) =>
                update("anniversary", dateString || "")
              }
              inputReadOnly={false}
              placeholder="YYYY-MM-DD"
            />
          </InlineField>
        </Card>

        <Card
          size="small"
          title={
            <Text strong style={{ fontSize: 12 }}>
              {t("contact.localisation")}
            </Text>
          }
          style={{ ...cardStyle, flex: 1, marginBottom: 0 }}
          headStyle={headStyle}
        >
          <InlineField label="GEO" style={{ marginBottom: 6 }}>
            <Input
              size="small"
              value={form.geo}
              onChange={(e) => update("geo", e.target.value)}
              style={{ flex: 1 }}
            />
          </InlineField>
          <InlineField label="TZ">
            <Input
              size="small"
              value={form.tz}
              onChange={(e) => update("tz", e.target.value)}
              style={{ flex: 1 }}
            />
          </InlineField>
        </Card>
      </div>

      {/* Note */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("contact.note")}
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <Input.TextArea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          rows={3}
          style={{ fontSize: 13 }}
        />
      </Card>

      {/* Sound */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("contact.sound")}
          </Text>
        }
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            type="text"
            onClick={async () => {
              try {
                const dataUrl = await OpenSoundFile();
                if (dataUrl) update("sound", dataUrl);
              } catch (e) {
                console.error("Erreur son:", e);
              }
            }}
          />
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        {!form.sound ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("contact.no_sound")}
          </Text>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["ogg", "mp3", "wav", "aac"].includes(form.sound.type) ? (
              <audio
                controls
                src={form.sound.url}
                style={{ flex: 1, height: 32 }}
              />
            ) : (
              <div style={{ flex: 1 }}>
                <Text type="warning" style={{ fontSize: 12 }}>
                  ⚠️ Format {form.sound.type?.toUpperCase()} non supporté par le
                  navigateur
                </Text>
                <br />
                <a href={form.sound.url} download={`sound.${form.sound.type}`}>
                  <Button size="small" icon={<DownloadOutlined />}>
                    Télécharger
                  </Button>
                </a>
              </div>
            )}
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => update("sound", null)}
            />
          </div>
        )}
      </Card>

      {/* Langues + IMPP côte à côte */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Card
          size="small"
          title={
            <Text strong style={{ fontSize: 12 }}>
              {t("contact.languages")}
            </Text>
          }
          extra={
            <Button
              size="small"
              icon={<PlusOutlined />}
              type="text"
              onClick={() =>
                update("lang", [...form.lang, { pref: "", value: "" }])
              }
            />
          }
          style={{ ...cardStyle, flex: 1, marginBottom: 0 }}
          headStyle={headStyle}
        >
          {form.lang.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t("contact.no_language")}
            </Text>
          )}
          {form.lang.map((l, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 6,
                alignItems: "center",
              }}
            >
              <Input
                size="small"
                placeholder="fr"
                value={l.value}
                onChange={(e) =>
                  update(
                    "lang",
                    form.lang.map((x, idx) =>
                      idx === i ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
                style={{ flex: 1 }}
              />
              <Input
                size="small"
                placeholder="pref"
                value={l.pref}
                onChange={(e) =>
                  update(
                    "lang",
                    form.lang.map((x, idx) =>
                      idx === i ? { ...x, pref: e.target.value } : x,
                    ),
                  )
                }
                style={{ width: 50 }}
              />
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  update(
                    "lang",
                    form.lang.filter((_, idx) => idx !== i),
                  )
                }
              />
            </div>
          ))}
        </Card>

        <ItemList
          title={t("contact.messaging")}
          items={form.impp}
          typeOptions={[
            "Skype",
            "WhatsApp",
            "Telegram",
            "Signal",
            "AIM",
            "Jabber",
          ]}
          onAdd={() =>
            update("impp", [...form.impp, { type: "skype", value: "" }])
          }
          onRemove={(i) =>
            update(
              "impp",
              form.impp.filter((_, idx) => idx !== i),
            )
          }
          onChange={(i, field, value) =>
            update(
              "impp",
              form.impp.map((x, idx) =>
                idx === i ? { ...x, [field]: value } : x,
              ),
            )
          }
          style={{ flex: 1, marginBottom: 0 }}
        />
      </div>

      {/* Personnes liées */}
      <ItemList
        title={t("contact.related")}
        items={form.related}
        typeOptions={[
          "Friend",
          "Spouse",
          "Child",
          "Parent",
          "Sibling",
          "Assistant",
          "Manager",
          "Colleague",
        ]}
        onAdd={() =>
          update("related", [...form.related, { type: "friend", value: "" }])
        }
        onRemove={(i) =>
          update(
            "related",
            form.related.filter((_, idx) => idx !== i),
          )
        }
        onChange={(i, field, value) =>
          update(
            "related",
            form.related.map((x, idx) =>
              idx === i ? { ...x, [field]: value } : x,
            ),
          )
        }
        style={{ marginBottom: 10 }}
      />

      {/* UID + REV */}
      {(form.uid || form.rev) && (
        <Card
          size="small"
          title={
            <Text strong style={{ fontSize: 12 }}>
              Métadonnées
            </Text>
          }
          style={cardStyle}
          headStyle={headStyle}
        >
          {form.uid && (
            <InlineField label="UID" style={{ marginBottom: form.rev ? 6 : 0 }}>
              <Input
                size="small"
                value={form.uid}
                onChange={(e) => update("uid", e.target.value)}
                style={{ flex: 1 }}
              />
            </InlineField>
          )}
          {form.rev && (
            <InlineField label="Révision">
              <Text type="secondary" style={{ fontSize: 12 }}>
                {form.rev}
              </Text>
            </InlineField>
          )}
        </Card>
      )}
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text strong style={{ fontSize: 16 }}>
          {form.fn || "Sans nom"}
        </Text>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={!dirty}
          size="small"
        >
          {dirty ? t("contact.save") : t("contact.saved")}
        </Button>
      </div>

      <Tabs
        items={[
          { key: "main", label: "Main", children: mainTab },
          { key: "extra", label: "Extra", children: extraTab },
        ]}
        style={{ flex: 1 }}
      />

      <AddressDialog
        open={adrDialogOpen}
        onOk={addAddress}
        onCancel={() => setAdrDialogOpen(false)}
      />
    </div>
  );
}
