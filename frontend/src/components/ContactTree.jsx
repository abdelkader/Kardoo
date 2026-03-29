import { useState, useEffect } from "react";
import {
  Avatar,
  Typography,
  Input,
  Empty,
  Checkbox,
  Button,
  Dropdown,
} from "antd";
import {
  UserOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExportOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { buildTree } from "../utils/groups";

const { Text } = Typography;

function ContactRow({
  contact,
  selected,
  onSelect,
  checked,
  onCheck,
  hovered,
  onHover,
  indent = false,
  onDelete,
  onDuplicate,
  onExport,
}) {
  const { t } = useTranslation();
  const isSelected = selected?.id === contact.id;

  const contextMenu = {
    items: [
      {
        key: "select",
        icon: <CheckSquareOutlined />,
        label: t("contact_menu.select"),
        onClick: () => onCheck(contact.id, !checked),
      },
      { type: "divider" },
      {
        key: "duplicate",
        icon: <CopyOutlined />,
        label: t("contact_menu.duplicate"),
        onClick: () => onDuplicate(contact),
      },
      {
        key: "export",
        icon: <ExportOutlined />,
        label: t("contact_menu.export"),
        onClick: () => onExport(contact),
      },
      { type: "divider" },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: t("contact_menu.delete"),
        danger: true,
        onClick: () => onDelete([contact.id]),
      },
    ],
  };

  return (
    <Dropdown menu={contextMenu} trigger={["contextMenu"]}>
      <div
        onMouseEnter={() => onHover(contact.id)}
        onMouseLeave={() => onHover(null)}
        style={{
          padding: indent ? "4px 10px 4px 28px" : "4px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: isSelected ? "#e6f4ff" : "transparent",
          borderLeft: isSelected
            ? "3px solid #1677ff"
            : "3px solid transparent",
        }}
      >
        <Avatar
          size={24}
          src={contact.photo || undefined}
          icon={<UserOutlined />}
          style={{
            backgroundColor: contact.photo ? "transparent" : "#1677ff",
            flexShrink: 0,
          }}
          onError={() => false}
        />
        <Text
          strong={isSelected}
          style={{ fontSize: 12, lineHeight: "1.2", flex: 1 }}
          onClick={() => onSelect(contact)}
        >
          {contact.fn}
        </Text>
        <div style={{ width: 16, flexShrink: 0 }}>
          {(hovered || checked) && (
            <Checkbox
              checked={checked}
              onChange={(e) => {
                e.stopPropagation();
                onCheck(contact.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    </Dropdown>
  );
}

function GroupFolder({
  group,
  members,
  selected,
  onSelect,
  onSelectGroup,
  checkedIds,
  onCheck,
  hoveredId,
  onHover,
}) {
  const [open, setOpen] = useState(true);
  const isSelected = selected?.id === group.id;

  return (
    <div>
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

      {open &&
        members.map((m, i) =>
          m.resolved ? (
            <ContactRow
              key={m.resolved.id}
              contact={m.resolved}
              selected={selected}
              onSelect={onSelect}
              indent={true}
              checked={checkedIds.includes(m.resolved.id)}
              onCheck={onCheck}
              hovered={hoveredId === m.resolved.id}
              onHover={onHover}
            />
          ) : (
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
  onDelete,
  onDuplicate,
  onExport,
  checkedIds,
  onCheckedChange,
  error,
}) {
  const { t } = useTranslation();

  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    onCheckedChange([]);
  }, [contacts]);

  const handleCheck = (id, checked) => {
    onCheckedChange((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  const { tree, ungrouped } = buildTree(contacts);

  const filteredFlat = contacts.filter(
    (c) =>
      c.kind !== "group" && c.fn.toLowerCase().includes(search.toLowerCase()),
  );
  const isSearching = search.trim().length > 0;

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            {contacts.filter((c) => c.kind !== "group").length}{" "}
            {t("app.no_contacts")}
          </Text>

          {/* Bouton supprimer — visible si cases cochées */}
          {checkedIds.length > 0 && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(checkedIds, () => setCheckedIds([]))}
            >
              {checkedIds.length}
            </Button>
          )}
        </div>
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
                checked={checkedIds.includes(c.id)}
                onCheck={handleCheck}
                hovered={hoveredId === c.id}
                onHover={setHoveredId}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onExport={onExport}
              />
            ))
          )}
        </div>
      ) : (
        <div>
          {tree.map(({ group, members }) => (
            <GroupFolder
              key={group.id}
              group={group}
              members={members}
              selected={selected}
              onSelect={onSelect}
              onSelectGroup={onSelect}
              checkedIds={checkedIds}
              onCheck={handleCheck}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}

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

          {ungrouped.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              selected={selected}
              onSelect={onSelect}
              checked={checkedIds.includes(c.id)}
              onCheck={handleCheck}
              hovered={hoveredId === c.id}
              onHover={setHoveredId}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onExport={onExport}
            />
          ))}
        </div>
      )}
    </>
  );
}
