import { useState, useEffect } from "react";
import { Card, Input, Button, Avatar, Typography, Select } from "antd";
import {
  UserOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { resolveMembers } from "../utils/groups";

const { Text } = Typography;
const cardStyle = { marginBottom: 10, borderColor: "#bbb" };
const headStyle = {
  backgroundColor: "#f0f0f0",
  borderBottom: "1px solid #bbb",
};

export default function GroupDetail({
  group,
  allContacts,
  onSave,
  onDirtyChange,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!group) return;
    setForm({
      fn: group.fn || "",
      uid: group.uid || "",
      members: group.members || [],
    });
    setDirty(false);
  }, [group]);

  if (!form) return null;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    onDirtyChange?.(true);
  };

  const handleSave = () => {
    onSave({ ...group, ...form });
    setDirty(false);
    onDirtyChange?.(false);
  };

  const resolvedMembers = resolveMembers(
    { members: form.members },
    allContacts,
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Barre titre + Save */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📂</span>
          <Text strong style={{ fontSize: 16 }}>
            {form.fn || "Groupe sans nom"}
          </Text>
        </div>
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

      {/* Infos groupe */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            Groupe
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 6,
          }}
        >
          <Text
            type="secondary"
            style={{ fontSize: 11, flexShrink: 0, width: 30 }}
          >
            Nom
          </Text>
          <Input
            size="small"
            value={form.fn}
            onChange={(e) => update("fn", e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Text
            type="secondary"
            style={{ fontSize: 11, flexShrink: 0, width: 30 }}
          >
            UID
          </Text>
          <Input
            size="small"
            value={form.uid}
            onChange={(e) => update("uid", e.target.value)}
            style={{ flex: 1, fontFamily: "monospace", fontSize: 11 }}
          />
        </div>
      </Card>

      {/* Membres */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            Membres ({resolvedMembers.filter((m) => m.resolved).length}/
            {form.members.length})
          </Text>
        }
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            type="text"
            onClick={() =>
              update("members", [...form.members, { type: "email", value: "" }])
            }
          />
        }
        style={{ ...cardStyle, flex: 1 }}
        headStyle={headStyle}
      >
        {form.members.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Aucun membre
          </Text>
        )}

        {resolvedMembers.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            {/* Type selector */}
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
                { value: "email", label: "📧" },
                { value: "uid", label: "🔑" },
              ]}
              style={{ width: 60 }}
            />

            {/* Valeur */}
            <Input
              size="small"
              value={m.value}
              placeholder={m.type === "email" ? "john@example.com" : "uuid..."}
              onChange={(e) =>
                update(
                  "members",
                  form.members.map((x, idx) =>
                    idx === i ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
              style={{
                flex: 1,
                fontFamily: m.type === "uid" ? "monospace" : "inherit",
                fontSize: 11,
              }}
            />

            {/* Contact résolu */}
            {m.resolved ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 120,
                }}
              >
                <Avatar
                  size={20}
                  src={m.resolved.photo || undefined}
                  icon={!m.resolved.photo && <UserOutlined />}
                  style={{ backgroundColor: "#1677ff", flexShrink: 0 }}
                />
                <Text style={{ fontSize: 11 }} type="success">
                  {m.resolved.fn}
                </Text>
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 11, minWidth: 120 }}>
                ⚠️ Non résolu
              </Text>
            )}

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
    </div>
  );
}
