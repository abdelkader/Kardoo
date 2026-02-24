import { useState } from "react";
import { Avatar, Typography, Input, Empty } from "antd";
import {
  UserOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { buildTree } from "../utils/groups";

const { Text } = Typography;

function ContactRow({ contact, selected, onSelect, indent = false }) {
  const isSelected = selected?.id === contact.id;
  return (
    <div
      onClick={() => onSelect(contact)}
      style={{
        padding: indent ? "4px 10px 4px 28px" : "4px 10px", // ← différence ici
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: isSelected ? "#e6f4ff" : "transparent",
        borderLeft: isSelected ? "3px solid #1677ff" : "3px solid transparent",
      }}
    >
      <Avatar
        size={24}
        src={contact.photo || undefined}
        icon={!contact.photo && <UserOutlined />}
        style={{
          backgroundColor: contact.photo ? "transparent" : "#1677ff",
          flexShrink: 0,
        }}
        onError={() => {
          return false;
        }}
      />
      <Text strong={isSelected} style={{ fontSize: 12, lineHeight: "1.2" }}>
        {contact.fn}
      </Text>
    </div>
  );
}

function GroupFolder({ group, members, selected, onSelect, onSelectGroup }) {
  const [open, setOpen] = useState(true);
  const isSelected = selected?.id === group.id;

  return (
    <div>
      {/* En-tête du dossier */}
      <div
        style={{
          padding: "5px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: isSelected ? "#fff7e6" : "transparent",
          borderLeft: isSelected
            ? "3px solid #fa8c16"
            : "3px solid transparent",
          userSelect: "none",
        }}
        onClick={() => {
          setOpen((o) => !o);
          onSelectGroup(group);
        }}
      >
        {open ? (
          <FolderOpenOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
        ) : (
          <FolderOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
        )}
        <Text strong style={{ fontSize: 12, flex: 1 }}>
          {group.fn}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {members.filter((m) => m.resolved).length}
        </Text>
      </div>

      {/* Membres du groupe */}
      {open &&
        members.map((m, i) =>
          m.resolved ? (
            <ContactRow
              key={m.resolved.id}
              contact={m.resolved}
              selected={selected}
              onSelect={onSelect}
              indent={true}
            />
          ) : (
            // Membre non résolu — affiché en grisé
            <div
              key={i}
              style={{
                padding: "3px 10px 3px 28px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Avatar
                size={20}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#ccc", flexShrink: 0 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {m.type === "email" ? "📧" : "🔑"} {m.value}
              </Text>
            </div>
          ),
        )}
    </div>
  );
}

export default function ContactTree({
  contacts,
  selected,
  search,
  onSearch,
  onSelect,
  error,
}) {
  const { t } = useTranslation();

  const filtered = contacts.filter((c) =>
    c.fn.toLowerCase().includes(search.toLowerCase()),
  );

  // Si recherche active — affichage plat
  const isSearching = search.trim().length > 0;

  const { tree, ungrouped } = buildTree(contacts);
  // Contacts filtrés pour la recherche
  const filteredFlat = contacts.filter(
    (c) =>
      c.kind !== "group" && c.fn.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div style={{ padding: "10px 10px 6px" }}>
        <Input.Search
          placeholder={t("app.search")}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ marginBottom: 6 }}
          size="small"
        />
        <Text type="secondary" style={{ fontSize: 11 }}>
          {contacts.filter((c) => c.kind !== "group").length}{" "}
          {t("app.no_contacts")}
        </Text>
      </div>

      {error && (
        <Text
          type="danger"
          style={{ padding: "0 10px", display: "block", fontSize: 12 }}
        >
          {error}
        </Text>
      )}

      {contacts.length === 0 ? (
        <Empty description={t("app.no_contacts")} style={{ marginTop: 40 }} />
      ) : isSearching ? (
        // Mode recherche — liste plate
        <div>
          {filteredFlat.length === 0 ? (
            <Empty description="Aucun résultat" style={{ marginTop: 20 }} />
          ) : (
            filteredFlat.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                selected={selected}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      ) : (
        // Mode arbre
        <div>
          {/* Groupes */}
          {tree.map(({ group, members }) => (
            <GroupFolder
              key={group.id}
              group={group}
              members={members}
              selected={selected}
              onSelect={onSelect}
              onSelectGroup={onSelect}
            />
          ))}

          {/* Séparateur si groupes + contacts sans groupe */}
          {tree.length > 0 && ungrouped.length > 0 && (
            <div
              style={{
                padding: "4px 10px",
                marginTop: 4,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Sans groupe
              </Text>
            </div>
          )}

          {/* Contacts sans groupe */}
          {ungrouped.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </>
  );
}
