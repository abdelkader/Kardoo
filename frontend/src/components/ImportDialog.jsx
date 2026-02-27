import { useState } from "react";
import { Modal, Typography, List, Avatar, Alert, Spin } from "antd";
import { UserOutlined, FileOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { OpenImportFiles } from "../../wailsjs/go/main/App";
import { parseImportFile } from "../utils/importFormats";

const { Text } = Typography;

export default function ImportDialog({ open, onClose, onImport }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);

  const handleChooseFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await OpenImportFiles();
      if (!files || files.length === 0) {
        setLoading(false);
        return;
      }

      const allContacts = [];
      for (const file of files) {
        const parsed = parseImportFile(file.content, file.ext);
        allContacts.push(...parsed);
      }
      setPreview(allContacts);
    } catch (e) {
      setError(e.message || "Erreur lors de la lecture des fichiers");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onImport(preview);
    setPreview([]);
    onClose();
  };

  const handleCancel = () => {
    setPreview([]);
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={preview.length > 0 ? handleConfirm : handleChooseFiles}
      okText={
        preview.length > 0
          ? t("import.confirm", { count: preview.length })
          : t("import.choose_files")
      }
      cancelText={t("import.cancel")}
      title={t("import.title")}
      width={480}
      centered
    >
      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 12 }} />
      )}

      {loading && <Spin style={{ display: "block", margin: "20px auto" }} />}

      {!loading && preview.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#999" }}>
          <FileOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <div>{t("import.hint")}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("import.formats")}
          </Text>
        </div>
      )}

      {preview.length > 0 && (
        <>
          <Text style={{ display: "block", marginBottom: 8 }}>
            {t("import.preview", { count: preview.length })}
          </Text>
          <List
            size="small"
            style={{
              maxHeight: 320,
              overflow: "auto",
              border: "1px solid #f0f0f0",
              borderRadius: 6,
            }}
            dataSource={preview}
            renderItem={(c) => (
              <List.Item style={{ padding: "6px 12px" }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={28}
                      src={c.photo}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: c.photo ? "transparent" : "#1677ff",
                      }}
                    />
                  }
                  title={<Text style={{ fontSize: 12 }}>{c.fn}</Text>}
                  description={
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {[c.org, c.tel?.[0]?.value, c.email?.[0]?.value]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Modal>
  );
}
