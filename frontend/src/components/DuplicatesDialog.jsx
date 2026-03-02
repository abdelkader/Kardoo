import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Avatar,
  Typography,
  Tag,
  Empty,
  Spin,
  Space,
  Checkbox,
} from "antd";
import {
  UserOutlined,
  MergeCellsOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { findDuplicates, mergeContacts } from "../utils/duplicates";

const { Text } = Typography;

function ContactCard({ contact }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "8px 12px",
        background: "#fafafa",
        borderRadius: 6,
        border: "1px solid #f0f0f0",
        flex: 1,
      }}
    >
      <Avatar
        size={36}
        src={contact.photo}
        icon={<UserOutlined />}
        style={{
          backgroundColor: contact.photo ? "transparent" : "#1677ff",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 12, display: "block" }}>
          {contact.fn}
        </Text>
        {contact.org && (
          <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
            {contact.org}
          </Text>
        )}
        {contact.tel?.map((t, i) => (
          <Text
            key={i}
            style={{ fontSize: 11, display: "block", color: "#1677ff" }}
          >
            📞 {t.value}
          </Text>
        ))}
        {contact.email?.map((e, i) => (
          <Text
            key={i}
            style={{ fontSize: 11, display: "block", color: "#52c41a" }}
          >
            ✉️ {e.value}
          </Text>
        ))}
      </div>
    </div>
  );
}

function DuplicateGroup({ group, onMerge, onIgnore, onDeleteDuplicates }) {
  const { t } = useTranslation();

  const reasonLabels = {
    both: t("duplicates.reason_both"),
    name: t("duplicates.reason_name"),
    phone: t("duplicates.reason_phone"),
    email: t("duplicates.reason_email"),
    name_email: t("duplicates.reason_name_email"),
    phone_email: t("duplicates.reason_phone_email"),
    all: t("duplicates.reason_all"),
  };

  const confidenceColor = group.confidence === "certain" ? "red" : "orange";

  return (
    <div
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Tag color={confidenceColor} style={{ fontSize: 11 }}>
          {group.confidence === "certain" ? "✓ " : "~ "}
          {t(`duplicates.confidence_${group.confidence}`)}
        </Tag>
        <Tag color="blue" style={{ fontSize: 11 }}>
          {reasonLabels[group.reason] || group.reason}
        </Tag>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {group.contacts.length} {t("duplicates.contacts")}
        </Text>
      </div>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}
      >
        {group.contacts.map((c) => (
          <ContactCard key={c.id} contact={c} />
        ))}
      </div>

      <Space>
        <Button
          size="small"
          type="primary"
          icon={<MergeCellsOutlined />}
          onClick={() => onMerge(group)}
        >
          {t("duplicates.merge")}
        </Button>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDeleteDuplicates(group)}
        >
          {t("duplicates.delete_duplicates")}
        </Button>
        <Button
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => onIgnore(group)}
        >
          {t("duplicates.ignore")}
        </Button>
      </Space>
    </div>
  );
}

export default function DuplicatesDialog({
  open,
  onClose,
  contacts,
  onSave,
  onDeleteContacts,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [options, setOptions] = useState({
    checkName: true,
    checkPhone: true,
    checkEmail: false,
  });

  const runSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const found = findDuplicates(contacts, options);
      setGroups(found);
      setLoading(false);
    }, 100);
  };

  useEffect(() => {
    if (!open) return;
    runSearch();
  }, [open]);

  const handleMerge = (group) => {
    const merged = mergeContacts(group.contacts);
    merged.id = group.contacts[0].id;
    onSave(merged);
    const idsToDelete = group.contacts.slice(1).map((c) => c.id);
    onDeleteContacts(idsToDelete);
    setGroups((prev) => prev.filter((g) => g !== group));
  };

  const handleDeleteDuplicates = (group) => {
    const idsToDelete = group.contacts.slice(1).map((c) => c.id);
    onDeleteContacts(idsToDelete);
    setGroups((prev) => prev.filter((g) => g !== group));
  };

  const handleIgnore = (group) => {
    setGroups((prev) => prev.filter((g) => g !== group));
  };

  const handleMergeAll = () => {
    [...groups].forEach((group) => handleMerge(group));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("duplicates.title")}
      width={680}
      centered
      footer={[
        groups.length > 1 && (
          <Button
            key="mergeall"
            type="primary"
            icon={<MergeCellsOutlined />}
            onClick={handleMergeAll}
          >
            {t("duplicates.merge_all", { count: groups.length })}
          </Button>
        ),
        <Button key="close" onClick={onClose}>
          {t("duplicates.close")}
        </Button>,
      ].filter(Boolean)}
    >
      {/* Options de recherche */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 16,
          padding: "8px 12px",
          background: "#f9f9f9",
          borderRadius: 6,
          border: "1px solid #f0f0f0",
        }}
      >
        <Text style={{ fontSize: 12, flexShrink: 0 }}>
          {t("duplicates.compare_by")}
        </Text>
        <Checkbox
          checked={options.checkName}
          onChange={(e) =>
            setOptions((p) => ({ ...p, checkName: e.target.checked }))
          }
        >
          <Text style={{ fontSize: 12 }}>{t("duplicates.check_name")}</Text>
        </Checkbox>
        <Checkbox
          checked={options.checkPhone}
          onChange={(e) =>
            setOptions((p) => ({ ...p, checkPhone: e.target.checked }))
          }
        >
          <Text style={{ fontSize: 12 }}>{t("duplicates.check_phone")}</Text>
        </Checkbox>
        <Checkbox
          checked={options.checkEmail}
          onChange={(e) =>
            setOptions((p) => ({ ...p, checkEmail: e.target.checked }))
          }
        >
          <Text style={{ fontSize: 12 }}>{t("duplicates.check_email")}</Text>
        </Checkbox>
        <Button size="small" type="primary" onClick={runSearch}>
          {t("duplicates.search")}
        </Button>
      </div>

      {loading && <Spin style={{ display: "block", margin: "40px auto" }} />}

      {!loading && groups.length === 0 && (
        <Empty
          description={t("duplicates.none_found")}
          style={{ margin: "40px 0" }}
        />
      )}

      {!loading && groups.length > 0 && (
        <>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 16, fontSize: 12 }}
          >
            {t("duplicates.found", { count: groups.length })}
          </Text>
          <div style={{ maxHeight: 440, overflow: "auto" }}>
            {groups.map((group, i) => (
              <DuplicateGroup
                key={i}
                group={group}
                onMerge={handleMerge}
                onIgnore={handleIgnore}
                onDeleteDuplicates={handleDeleteDuplicates}
              />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
