import { t } from "i18next";
import IconBarBtn from "./IconBarBtn";
import { Dropdown } from "antd";
import {
  FolderOpenOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
  QrcodeOutlined,
  ToolOutlined,
  ImportOutlined,
  ExportOutlined,
  PictureOutlined,
} from "@ant-design/icons";

export default function IconBar({
  onOpen,
  onSettings,
  onAbout,
  onNewContact,
  onQrCode,
  onImport,
  onExport,
  onMedia,
}) {
  const toolsMenu = {
    items: [
      {
        key: "import",
        icon: <ImportOutlined />,
        label: t("tools.import"),
        onClick: onImport,
      },
      {
        key: "export",
        icon: <ExportOutlined />,
        label: t("tools.export"),
        onClick: onExport,
      },
      { type: "divider" },
      {
        key: "media",
        icon: <PictureOutlined />,
        label: t("tools.media"),
        onClick: onMedia,
      },
    ],
  };

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
        tooltip={t("contact.new_contact")}
        onClick={onNewContact}
      />
      <IconBarBtn
        icon={<FolderOpenOutlined />}
        tooltip={t("app.open")}
        onClick={onOpen}
      />
      <IconBarBtn
        icon={<QrcodeOutlined />}
        tooltip={t("app.qrcode")}
        onClick={onQrCode}
      />

      {/* Tools dropdown — placement à droite de l'IconBar */}
      <Dropdown menu={toolsMenu} trigger={["click"]} placement="rightTop">
        <span>
          <IconBarBtn icon={<ToolOutlined />} tooltip={t("tools.title")} />
        </span>
      </Dropdown>

      <div style={{ flex: 1 }} />
      <IconBarBtn
        icon={<SettingOutlined />}
        tooltip={t("settings.title")}
        onClick={onSettings}
      />
      <IconBarBtn
        icon={<InfoCircleOutlined />}
        tooltip={t("about.title")}
        onClick={onAbout}
      />
    </div>
  );
}
