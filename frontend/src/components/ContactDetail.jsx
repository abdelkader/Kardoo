import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import { OpenImageFile } from "../../wailsjs/go/main/App";
import { useState, useEffect } from "react";
import {
  Tabs,
  Input,
  Button,
  Avatar,
  DatePicker,
  Typography,
  Divider,
  Card,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import AddressDialog from "./AddressDialog";
const { Text } = Typography;

// Types de téléphone et URL disponibles
const TEL_TYPES = ["Cell", "Home", "Work", "Fax", "Voice", "Pager"];
const URL_TYPES = [
  "Home",
  "Work",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Twitter",
];

dayjs.extend(customParseFormat);

function FieldRow({ label, children, style }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        ...style,
      }}
    >
      {label && (
        <Text
          type="secondary"
          style={{ width: 60, flexShrink: 0, fontSize: 12 }}
        >
          {label}
        </Text>
      )}
      {children}
    </div>
  );
}

function MultiLinePanel({
  title,
  items,
  typeOptions,
  onAdd,
  onRemove,
  onChange,
}) {
  return (
    <Card
      size="small"
      title={
        <Text strong style={{ fontSize: 13 }}>
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
      style={{ marginBottom: 12 }}
    >
      {items.length === 0 && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Aucun élément
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
              cursor: "pointer",
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

  // Initialiser le formulaire quand le contact change
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
      url: contact.url ? [{ type: "home", value: contact.url }] : [],
      org: contact.org || "",
      title: contact.title || "",
      note: contact.note || "",
      gender: contact.gender || "",
      tz: contact.tz || "",
    });
    setDirty(false);
  }, [contact]);

  if (!form) return null;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    onDirtyChange?.(true); // ← remonte l'état
  };

  const handleSave = () => {
    onSave({ ...contact, ...form });
    setDirty(false);
    onDirtyChange?.(false); // ← remonte l'état
  };

  // Adresses
  const addAddress = ({ types, preferred }) => {
    const type = types[0];
    const newAdr = {
      type,
      value: ["", "", "", "", "", "", ""],
      raw: ["", "", "", "", "", "", ""],
    };
    update("adr", [...form.adr, newAdr]);
    setAdrDialogOpen(false);
  };

  const removeAddress = (i) => {
    update(
      "adr",
      form.adr.filter((_, idx) => idx !== i),
    );
  };

  const updateAdrPart = (adrIdx, partIdx, value) => {
    const newAdr = form.adr.map((a, i) => {
      if (i !== adrIdx) return a;
      const newRaw = [...(a.raw || ["", "", "", "", "", "", ""])];
      newRaw[partIdx] = value;
      return { ...a, raw: newRaw, value: newRaw };
    });
    update("adr", newAdr);
  };

  // Téléphones
  const addTel = () =>
    update("tel", [...form.tel, { type: "cell", value: "" }]);
  const removeTel = (i) =>
    update(
      "tel",
      form.tel.filter((_, idx) => idx !== i),
    );
  const updateTel = (i, field, value) => {
    update(
      "tel",
      form.tel.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)),
    );
  };

  // URLs
  const addUrl = () =>
    update("url", [...form.url, { type: "home", value: "" }]);
  const removeUrl = (i) =>
    update(
      "url",
      form.url.filter((_, idx) => idx !== i),
    );
  const updateUrl = (i, field, value) => {
    update(
      "url",
      form.url.map((u, idx) => (idx === i ? { ...u, [field]: value } : u)),
    );
  };

  // Onglet Main
  const mainTab = (
    <div>
      {/* Groupbox Name */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            Name
          </Text>
        }
        style={{ marginBottom: 10, borderColor: "#bbb" }}
        headStyle={{
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #bbb",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            {/* Ligne 1 : Title + Full */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                  Title
                </Text>
                <Input
                  size="small"
                  value={form.prefix}
                  onChange={(e) => update("prefix", e.target.value)}
                  style={{ width: 70 }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                  Full
                </Text>
                <Input
                  size="small"
                  value={form.fn}
                  onChange={(e) => update("fn", e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Ligne 2 : First + Middle + Last */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                  First
                </Text>
                <Input
                  size="small"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                  Middle
                </Text>
                <Input
                  size="small"
                  value={form.middleName}
                  onChange={(e) => update("middleName", e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                  Last
                </Text>
                <Input
                  size="small"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Ligne 3 : Birthday */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                Birthdate
              </Text>
              <DatePicker
                size="small"
                format={["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]}
                value={
                  form.bday
                    ? dayjs(form.bday, ["YYYY-MM-DD", "YYYYMMDD", "--MM-DD"])
                    : null
                }
                onChange={(date, dateString) =>
                  update("bday", dateString || "")
                }
                inputReadOnly={false}
                placeholder="YYYY-MM-DD"
              />
            </div>
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
            <Button
              size="small"
              icon={<CameraOutlined />}
              type="text"
              style={{ fontSize: 11 }}
              onClick={async () => {
                try {
                  const dataUrl = await OpenImageFile();
                  if (dataUrl) update("photo", dataUrl);
                } catch (e) {
                  console.error("Erreur photo:", e);
                }
              }}
            >
              Changer
            </Button>
          </div>
        </div>
      </Card>

      {/* Groupbox Address */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            Address
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
        style={{ marginBottom: 10, borderColor: "#bbb" }}
        headStyle={{
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #bbb",
        }}
      >
        {form.adr.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Aucune adresse
          </Text>
        )}
        {form.adr.length > 0 && (
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, width: 50, flexShrink: 0 }}
                    >
                      Addres
                    </Text>
                    <Input
                      size="small"
                      value={a.raw?.[2] || ""}
                      onChange={(e) => updateAdrPart(i, 2, e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        Ext
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[1] || ""}
                        onChange={(e) => updateAdrPart(i, 1, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        City
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[3] || ""}
                        onChange={(e) => updateAdrPart(i, 3, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        Region
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[4] || ""}
                        onChange={(e) => updateAdrPart(i, 4, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        Zip
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[5] || ""}
                        onChange={(e) => updateAdrPart(i, 5, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        PO
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[0] || ""}
                        onChange={(e) => updateAdrPart(i, 0, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        Country
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[6] || ""}
                        onChange={(e) => updateAdrPart(i, 6, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Card>

      {/* Téléphones & Web côte à côte */}
      <div style={{ display: "flex", gap: 10 }}>
        <Card
          size="small"
          title={
            <Text strong style={{ fontSize: 12 }}>
              Phones
            </Text>
          }
          extra={
            <Button
              size="small"
              icon={<PlusOutlined />}
              type="text"
              onClick={addTel}
            />
          }
          style={{ flex: 1, borderColor: "#bbb" }}
          headStyle={{
            backgroundColor: "#f0f0f0",
            borderBottom: "1px solid #bbb",
          }}
        >
          {form.tel.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Aucun téléphone
            </Text>
          )}
          {form.tel.map((item, i) => (
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
                onChange={(e) => updateTel(i, "type", e.target.value)}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 12,
                  color: "#555",
                  background: "#fafafa",
                }}
              >
                {TEL_TYPES.map((t) => (
                  <option key={t} value={t.toLowerCase()}>
                    {t}
                  </option>
                ))}
              </select>
              <Input
                size="small"
                value={item.value}
                onChange={(e) => updateTel(i, "value", e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeTel(i)}
              />
            </div>
          ))}
        </Card>

        <Card
          size="small"
          title={
            <Text strong style={{ fontSize: 12 }}>
              Web
            </Text>
          }
          extra={
            <Button
              size="small"
              icon={<PlusOutlined />}
              type="text"
              onClick={addUrl}
            />
          }
          style={{ flex: 1, borderColor: "#bbb" }}
          headStyle={{
            backgroundColor: "#f0f0f0",
            borderBottom: "1px solid #bbb",
          }}
        >
          {form.url.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Aucune URL
            </Text>
          )}
          {form.url.map((item, i) => (
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
                onChange={(e) => updateUrl(i, "type", e.target.value)}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 12,
                  color: "#555",
                  background: "#fafafa",
                }}
              >
                {URL_TYPES.map((t) => (
                  <option key={t} value={t.toLowerCase()}>
                    {t}
                  </option>
                ))}
              </select>
              <Input
                size="small"
                value={item.value}
                onChange={(e) => updateUrl(i, "value", e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeUrl(i)}
              />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  // Onglet Extra
  const extraTab = (
    <div>
      <FieldRow label="Org">
        <Input
          size="small"
          value={form.org}
          onChange={(e) => update("org", e.target.value)}
          style={{ flex: 1 }}
        />
      </FieldRow>
      <FieldRow label="Title">
        <Input
          size="small"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          style={{ flex: 1 }}
        />
      </FieldRow>
      <FieldRow label="Gender">
        <Input
          size="small"
          value={form.gender}
          onChange={(e) => update("gender", e.target.value)}
          style={{ width: 60 }}
        />
      </FieldRow>
      <FieldRow label="TZ">
        <Input
          size="small"
          value={form.tz}
          onChange={(e) => update("tz", e.target.value)}
          style={{ flex: 1 }}
        />
      </FieldRow>
      <div style={{ marginBottom: 8 }}>
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 4 }}
        >
          Note
        </Text>
        <Input.TextArea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          rows={4}
          style={{ fontSize: 13 }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Barre de titre + Save */}
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
          {dirty ? "Sauvegarder" : "Sauvegardé"}
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
