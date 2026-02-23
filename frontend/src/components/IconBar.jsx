import {
  FolderOpenOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import IconBarBtn from "./IconBarBtn";

export default function IconBar({ onOpen, onSettings, onAbout }) {
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
        icon={<FolderOpenOutlined />}
        tooltip="Ouvrir un fichier .vcf"
        onClick={onOpen}
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
