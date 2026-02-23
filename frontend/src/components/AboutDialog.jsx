import { Modal, Button, Typography, Divider } from "antd";
import logo from "../assets/logo.png";

const { Text } = Typography;

export default function AboutDialog({ open, onClose }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Fermer
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
          A tool to edit (Modify, delete) VCF files.
          <br />
          Manage your vCard contacts with ease.
        </Text>
        <Divider />
        <Text type="secondary" style={{ fontSize: 12 }}>
          © 2025 abdelkader · All rights reserved
        </Text>
      </div>
    </Modal>
  );
}
