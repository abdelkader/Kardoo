import { List, Avatar, Typography, Input, Empty } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
const { Text } = Typography;

export default function ContactList({
  contacts,
  filtered,
  selected,
  search,
  onSearch,
  onSelect,
  error,
}) {
  const { t } = useTranslation();
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
          {filtered.length}{" "}
          {filtered.length !== 1 ? t("app.contacts_plural") : t("app.contact")}
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
      ) : (
        <List
          dataSource={filtered}
          renderItem={(c) => (
            <List.Item
              onClick={() => onSelect(c)}
              style={{
                padding: "6px 10px",
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
                  onError={() => true}
                />
                <Text
                  strong={selected?.id === c.id}
                  style={{ fontSize: 13, lineHeight: "1.2" }}
                >
                  {c.fn}
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}
    </>
  );
}
