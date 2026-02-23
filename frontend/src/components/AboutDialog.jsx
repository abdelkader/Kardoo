import { Modal, Button, Typography, Divider } from "antd";
import logo from "../assets/logo.png";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default function AboutDialog({ open, onClose }) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          {t("about.close")}
        </Button>
      }
      width={360}
      centered
    >
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <img
          src={logo}
          alt="Kardoo"
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            marginBottom: 12,
            objectFit: "contain",
          }}
        />
        <Typography.Title level={4} style={{ margin: 0 }}>
          Kardoo
        </Typography.Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Version 1.0.0
        </Text>
        <Divider />
        <Text style={{ fontSize: 13 }}>
          {t("about.description")}
          <br />
          {t("about.subtitle")}
        </Text>
        <Divider />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t("about.copyright")}
        </Text>
      </div>
    </Modal>
  );
}
