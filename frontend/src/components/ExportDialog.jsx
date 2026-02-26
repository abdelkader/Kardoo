import { useState } from "react";
import { Modal, Radio, Typography, Space, Badge } from "antd";
import { FileOutlined, FolderOutlined } from "@ant-design/icons";
import { generateVCard } from "../utils/vcard";
import { useTranslation } from "react-i18next";
import {
  toJCard,
  toXCard,
  toCSV,
  sanitizeFilename,
} from "../utils/exportFormats";
import { ExportToFile, ExportToFolder } from "../../wailsjs/go/main/App";

const { Text } = Typography;

export default function ExportDialog({ open, onClose, contacts }) {
  const [format, setFormat] = useState("vcf");
  const [destination, setDestination] = useState("single");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const count = contacts?.length || 0;

  const getExtension = () => {
    switch (format) {
      case "json":
        return ".json";
      case "csv":
        return ".csv";
      case "xml":
        return ".xml";
      default:
        return ".vcf";
    }
  };

  const generateContent = (contactList) => {
    switch (format) {
      case "json":
        return toJCard(contactList);
      case "csv":
        return toCSV(contactList);
      case "xml":
        return toXCard(contactList);
      default:
        return contactList.map((c) => generateVCard(c)).join("\n");
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      if (destination === "single") {
        const content = generateContent(contacts);
        const defaultName =
          count === 1 ? sanitizeFilename(contacts[0].fn) : `contacts_${count}`;
        await ExportToFile(content, defaultName, getExtension());
      } else {
        // Un fichier par contact
        const files = {};
        contacts.forEach((c) => {
          const name = sanitizeFilename(c.fn) + getExtension();
          files[name] = generateContent([c]);
        });
        await ExportToFolder(files);
      }
      onClose();
    } catch (e) {
      console.error("Erreur export:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleExport}
      okText={t("export.ok")}
      cancelText={t("export.cancel")}
      confirmLoading={loading}
      title={
        <span>
          {t(count > 1 ? "export.title_plural" : "export.title", { count })}
        </span>
      }
      width={380}
      centered
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%", marginTop: 16 }}
      >
        {/* Format */}
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            {t("export.format")}
          </Text>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="vcf">
                <Text>.vcf</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {t("export.vcf_desc")}
                </Text>
              </Radio>
              <Radio value="json">
                <Text>.json</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {t("export.json_desc")}
                </Text>
              </Radio>
              <Radio value="csv">
                <Text>.csv</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {t("export.csv_desc")}
                </Text>
              </Radio>
              <Radio value="xml">
                <Text>.xml</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {t("export.xml_desc")}
                </Text>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* Destination */}
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            {t("export.destination")}
          </Text>
          <Radio.Group
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="single">
                <FileOutlined style={{ marginRight: 6 }} />
                <Text>{t("export.single_file")}</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {t("export.single_file_desc")}
                </Text>
              </Radio>
              <Radio value="folder" disabled={format === "csv"}>
                <FolderOutlined style={{ marginRight: 6 }} />
                <Text>{t("export.one_per_contact")}</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {format === "csv"
                    ? t("export.csv_no_split")
                    : t("export.one_per_contact_desc")}
                </Text>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </Space>
    </Modal>
  );
}
