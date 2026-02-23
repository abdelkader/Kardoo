import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Modal,
  Switch,
  Button,
  Input,
  Divider,
  Typography,
  Card,
  Select,
} from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import {
  SaveConfig,
  LoadConfig,
  ChooseDirectory,
  GetWindowPosition,
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
    windowX: 0,
    windowY: 0,
    windowWidth: 1200,
    windowHeight: 800,
    backupOnSave: false,
    backupDir: "",
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

  const handleSaveWindowPos = async () => {
    try {
      const pos = await GetWindowPosition();
      setConfig((prev) => ({
        ...prev,
        windowX: pos.x,
        windowY: pos.y,
        windowWidth: pos.width,
        windowHeight: pos.height,
      }));
      setSaved(false);
    } catch (e) {
      console.error(e);
    }
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
      await SaveConfig({ ...config, language: i18n.language });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
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
      {/* Fenêtre */}
      <Card
        size="small"
        title={
          <Text strong style={{ fontSize: 12 }}>
            {t("settings.window")}
          </Text>
        }
        style={cardStyle}
        headStyle={headStyle}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, width: 60 }}>
            {t("settings.position_x")}
          </Text>
          <Input
            size="small"
            type="number"
            value={config.windowX}
            onChange={(e) => update("windowX", parseInt(e.target.value) || 0)}
            style={{ width: 80 }}
          />
          <Text style={{ fontSize: 12, width: 20 }}>Y</Text>
          <Input
            size="small"
            type="number"
            value={config.windowY}
            onChange={(e) => update("windowY", parseInt(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, width: 60 }}>{t("settings.width")}</Text>
          <Input
            size="small"
            type="number"
            value={config.windowWidth}
            onChange={(e) =>
              update("windowWidth", parseInt(e.target.value) || 800)
            }
            style={{ width: 80 }}
          />
          <Text style={{ fontSize: 12, width: 20 }}>H</Text>
          <Input
            size="small"
            type="number"
            value={config.windowHeight}
            onChange={(e) =>
              update("windowHeight", parseInt(e.target.value) || 600)
            }
            style={{ width: 80 }}
          />
        </div>
        <Button size="small" onClick={handleSaveWindowPos}>
          {t("settings.capture")}
        </Button>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
          {t("settings.window_position_saved")}
        </Text>
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
          onChange={(lng) => i18n.changeLanguage(lng)}
          options={[
            { value: "fr", label: "🇫🇷 Français" },
            { value: "en", label: "🇬🇧 English" },
          ]}
          style={{ width: 160 }}
        />
      </Card>
      {/* Backup */}
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
          <Text style={{ fontSize: 12 }}>
            {t("settings.create_backup_on_save")}
          </Text>
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
