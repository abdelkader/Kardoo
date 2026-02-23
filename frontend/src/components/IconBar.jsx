import {
  FolderOpenOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import IconBarBtn from "./IconBarBtn";
import { useTranslation } from "react-i18next";

export default function IconBar({ onOpen, onSettings, onAbout }) {
  const { t } = useTranslation();

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
        tooltip={t("app.open")}
        onClick={onOpen}
      />
      <div style={{ flex: 1 }} />
      <IconBarBtn
        icon={<SettingOutlined />}
        tooltip={t("app.settings")}
        onClick={onSettings}
      />
      <IconBarBtn
        icon={<InfoCircleOutlined />}
        tooltip={t("app.about")}
        onClick={onAbout}
      />
    </div>
  );
}
