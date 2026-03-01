import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Modal,
  Switch,
  Button,
  Input,
  Typography,
  Card,
  Select,
  Checkbox,
} from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import {
  SaveConfig,
  LoadConfig,
  ChooseDirectory,
} from "../../wailsjs/go/main/App";

const { Text } = Typography;

const cardStyle = { marginBottom: 10, borderColor: "#bbb" };
const headStyle = {
  backgroundColor: "#f0f0f0",
  borderBottom: "1px solid #bbb",
};

const ALL_FIELDS = [
  { value: "fn", label: "Full Name" },
  { value: "n", label: "Name (first, last...)" },
  { value: "photo", label: "Photo" },
  { value: "logo", label: "Logo" },
  { value: "org", label: "Organization" },
  { value: "title", label: "Title" },
  { value: "role", label: "Role" },
  { value: "nickname", label: "Nickname" },
  { value: "tel", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "adr", label: "Address" },
  { value: "url", label: "Website" },
  { value: "bday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "gender", label: "Gender" },
  { value: "note", label: "Note" },
  { value: "categories", label: "Categories" },
  { value: "geo", label: "Geo" },
  { value: "tz", label: "Timezone" },
  { value: "lang", label: "Languages" },
  { value: "impp", label: "Messaging" },
  { value: "related", label: "Related" },
  { value: "sound", label: "Sound" },
  { value: "uid", label: "UID" },
  { value: "rev", label: "Revision" },
];

export default function SettingsDialog({ open, onClose }) {
  const { t, i18n } = useTranslation();

  const [config, setConfig] = useState({
    backupOnSave: false,
    backupDir: "",
    language: "",
  });
  const [saved, setSaved] = useState(false);
  const isAllSelected =
    !config.exportFields || config.exportFields.length === 0;
  useEffect(() => {
    if (open) {
      LoadConfig().then(setConfig).catch(console.error);
    }
  }, [open]);

  const update = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleChooseDir = async () => {
    try {
      const dir = await ChooseDirectory();
      if (dir) update("backupDir", dir);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    try {
      await SaveConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("SaveConfig failed:", e);
    }
  };

  return (
    <Modal
      open={open}
      title={t("settings.title")}
      onCancel={onClose}
      width={480}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t("settings.close")}
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          {saved ? t("settings.saved") : t("settings.save")}
        </Button>,
      ]}
    >
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("settings.export_fields")}
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <div style={{ marginBottom: 8 }}>
          <Checkbox
            checked={isAllSelected}
            onChange={(e) =>
              update(
                "exportFields",
                e.target.checked ? [] : ALL_FIELDS.map((f) => f.value),
              )
            }
          >
            <Text style={{ fontSize: 12 }}>
              {t("settings.export_all_fields")}
            </Text>
          </Checkbox>
        </div>
        {!isAllSelected && (
          <Checkbox.Group
            value={config.exportFields}
            onChange={(values) => update("exportFields", values)}
            style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}
          >
            {ALL_FIELDS.map((f) => (
              <Checkbox
                key={f.value}
                value={f.value}
                style={{ fontSize: 12, marginLeft: 0 }}
              >
                {f.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        )}
      </Card>
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("settings.language")}
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <Select
          size="small"
          value={i18n.language}
          onChange={(lng) => {
            i18n.changeLanguage(lng);
            update("language", lng);
          }}
          options={[
            { value: "fr", label: "🇫🇷 Français" },
            { value: "en", label: "🇬🇧 English" },
          ]}
          style={{ width: 160 }}
        />
      </Card>

      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("settings.backup")}
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <Switch
            size="small"
            checked={config.backupOnSave}
            onChange={(v) => update("backupOnSave", v)}
          />
          <Text style={{ fontSize: 12 }}>{t("settings.backup_on_save")}</Text>
        </div>
        {config.backupOnSave && (
          <div>
            <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              {t("settings.backup_dir")}
            </Text>
            <div style={{ display: "flex", gap: 6 }}>
              <Input
                size="small"
                value={config.backupDir}
                placeholder={t("settings.backup_placeholder")}
                onChange={(e) => update("backupDir", e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                size="small"
                icon={<FolderOpenOutlined />}
                onClick={handleChooseDir}
              />
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 11, marginTop: 4, display: "block" }}
            >
              {t("settings.backup_hint")}
            </Text>
          </div>
        )}
      </Card>
    </Modal>
  );
}
