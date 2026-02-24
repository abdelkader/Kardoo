import { t } from "i18next";
import IconBarBtn from "./IconBarBtn";

import {
  FolderOpenOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";

export default function IconBar({
  onOpen,
  onSettings,
  onAbout,
  onNewContact,
  onQrCode,
}) {
  return (
    <div
      style={{
        width: 52,
        background: "#1e1e2e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 0",
        gap: 4,
        borderRight: "1px solid #333",
      }}
    >
      <IconBarBtn
        icon={<UserAddOutlined />}
        tooltip="Nouveau contact"
        onClick={onNewContact}
      />
      <IconBarBtn
        icon={<FolderOpenOutlined />}
        tooltip="Ouvrir un fichier .vcf"
        onClick={onOpen}
      />
      <IconBarBtn
        icon={<QrcodeOutlined />}
        tooltip="Exporter en QR Code"
        onClick={onQrCode}
      />

      <div style={{ flex: 1 }} />

      <IconBarBtn
        icon={<SettingOutlined />}
        tooltip="Paramètres"
        onClick={onSettings}
      />
      <IconBarBtn
        icon={<InfoCircleOutlined />}
        tooltip="À propos"
        onClick={onAbout}
      />
    </div>
  );
}
