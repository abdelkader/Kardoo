import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Modal, Switch, Button, Input, Typography, Card, Select } from "antd";
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

export default function SettingsDialog({ open, onClose }) {
  const { t, i18n } = useTranslation();

  const [config, setConfig] = useState({
    backupOnSave: false,
    backupDir: "",
    language: "",
  });
  const [saved, setSaved] = useState(false);

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
