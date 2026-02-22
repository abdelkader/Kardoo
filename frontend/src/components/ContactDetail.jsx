import { useState, useEffect } from "react";
import {
  Tabs,
  Input,
  Button,
  Avatar,
  DatePicker,
  Tag,
  Typography,
  Divider,
  Modal,
  Space,
  Card,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AddressDialog from "./AddressDialog";
import { formatAdr } from "../utils/vcard";

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

export default function ContactDetail({ contact, onSave }) {
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
      {/* Section Name */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Text
            strong
            style={{
              fontSize: 12,
              color: "#888",
              display: "block",
              marginBottom: 6,
            }}
          >
            NAME
          </Text>
          <FieldRow label="Title">
            <Input
              size="small"
              value={form.prefix}
              onChange={(e) => update("prefix", e.target.value)}
              style={{ width: 80 }}
            />
          </FieldRow>
          <FieldRow label="Full">
            <Input
              size="small"
              value={form.fn}
              onChange={(e) => update("fn", e.target.value)}
              style={{ flex: 1 }}
            />
          </FieldRow>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                First
              </Text>
              <Input
                size="small"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Middle
              </Text>
              <Input
                size="small"
                value={form.middleName}
                onChange={(e) => update("middleName", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Last
              </Text>
              <Input
                size="small"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
          </div>
          <FieldRow label="Birthday">
            <Input
              size="small"
              value={form.bday}
              onChange={(e) => update("bday", e.target.value)}
              placeholder="YYYY-MM-DD"
              style={{ width: 140 }}
            />
          </FieldRow>
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
            size={90}
            src={form.photo || undefined}
            icon={!form.photo && <UserOutlined />}
            style={{ backgroundColor: form.photo ? "transparent" : "#1677ff" }}
          />
          <Button
            size="small"
            icon={<CameraOutlined />}
            type="text"
            style={{ fontSize: 11 }}
          >
            Changer
          </Button>
        </div>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      {/* Section Adresses */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text strong style={{ fontSize: 12, color: "#888" }}>
            ADRESSES
          </Text>
          <Button
            size="small"
            icon={<PlusOutlined />}
            type="text"
            onClick={() => setAdrDialogOpen(true)}
          />
        </div>

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
                <div style={{ padding: "8px 0" }}>
                  {/* Street */}
                  <FieldRow label="Street">
                    <Input
                      size="small"
                      value={a.raw?.[2] || ""}
                      onChange={(e) => updateAdrPart(i, 2, e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </FieldRow>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        City
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[3] || ""}
                        onChange={(e) => updateAdrPart(i, 3, e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Region
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[4] || ""}
                        onChange={(e) => updateAdrPart(i, 4, e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Zip
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[5] || ""}
                        onChange={(e) => updateAdrPart(i, 5, e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Country
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[6] || ""}
                        onChange={(e) => updateAdrPart(i, 6, e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Ext
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[1] || ""}
                        onChange={(e) => updateAdrPart(i, 1, e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        PO Box
                      </Text>
                      <Input
                        size="small"
                        value={a.raw?.[0] || ""}
                        onChange={(e) => updateAdrPart(i, 0, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </div>

      <Divider style={{ margin: "8px 0" }} />

      {/* Téléphones & Web */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <MultiLinePanel
            title="Téléphones"
            items={form.tel}
            typeOptions={TEL_TYPES}
            onAdd={addTel}
            onRemove={removeTel}
            onChange={updateTel}
          />
        </div>
        <div style={{ flex: 1 }}>
          <MultiLinePanel
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
