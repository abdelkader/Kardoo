import { t } from "i18next";
import IconBarBtn from "./IconBarBtn";

import {
  FolderOpenOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

export default function IconBar({ onOpen, onSettings, onAbout, onNewContact }) {
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
      {/* Nouveau contact — en première position */}
      <IconBarBtn
        icon={<UserAddOutlined />}
        tooltip={t("contact.new_contact")}
        onClick={onNewContact}
      />

      {/* Ouvrir fichier */}
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
