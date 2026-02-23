import { useState } from "react";
import {
  Layout,
  List,
  Input,
  Button,
  Avatar,
  Typography,
  Empty,
  Modal,
  Tooltip,
  Divider,
} from "antd";
import {
  UserOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { OpenVCardFile, SaveVCardFile } from "../wailsjs/go/main/App";
import { splitAndParse, generateAllVCards } from "./utils/vcard";
import ContactDetail from "./components/ContactDetail";
import "antd/dist/reset.css";
import logo from "./assets/logo.png";

const { Sider, Content } = Layout;
const { Text } = Typography;
function IconBarBtn({ icon, tooltip, onClick, active }) {
  return (
    <Tooltip title={tooltip} placement="right">
      <button
        onClick={onClick}
        style={{
          width: 38,
          height: 38,
          border: "none",
          borderRadius: 8,
          background: active ? "#3b3b52" : "transparent",
          color: active ? "#fff" : "#aaa",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#3b3b52";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = active ? "#3b3b52" : "transparent";
          e.currentTarget.style.color = active ? "#fff" : "#aaa";
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [displayedContact, setDisplayedContact] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const withDirtyCheck = (action) => {
    if (isDirty) {
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  const handleSelectContact = (c) =>
    withDirtyCheck(() => {
      setSelected(c);
      setDisplayedContact(c);
    });

  const handleOpen = () =>
    withDirtyCheck(async () => {
      setError("");
      try {
        const result = await OpenVCardFile();
        if (!result) return;
        setCurrentFilePath(result.path);
        const parsed = splitAndParse(result.content);
        setContacts(parsed);
        setSelected(parsed[0] || null);
        setDisplayedContact(parsed[0] || null);
        setIsDirty(false);
      } catch (e) {
        setError("Erreur : " + e.message);
      }
    });

  const handleSaveContact = async (updated) => {
    const newContacts = contacts.map((c) =>
      c.id === updated.id ? updated : c,
    );
    setContacts(newContacts);
    setSelected(updated);
    setDisplayedContact(updated);
    try {
      await SaveVCardFile(currentFilePath, generateAllVCards(newContacts));
    } catch (e) {
      setError("Erreur de sauvegarde : " + e.message);
    }
  };

  const filtered = contacts.filter((c) =>
    c.fn.toLowerCase().includes(search.toLowerCase()),
  );

  // Remplace Layout, Sider, Content par :
  return (
    <Layout style={{ height: "100vh" }}>
      {/* Barre d'icônes verticale */}
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
        {/* Bouton ouvrir — en haut */}
        <IconBarBtn
          icon={<FolderOpenOutlined />}
          tooltip="Ouvrir un fichier .vcf"
          onClick={handleOpen}
        />

        {/* Spacer — pousse les boutons du bas vers le bas */}
        <div style={{ flex: 1 }} />

        {/* Paramètres — en bas */}
        <IconBarBtn
          icon={<SettingOutlined />}
          tooltip="Paramètres"
          onClick={() => {
            /* TODO */
          }}
        />
        <IconBarBtn
          icon={<InfoCircleOutlined />}
          tooltip="À propos"
          onClick={() => setAboutOpen(true)}
        />
      </div>

      {/* Sidebar contacts */}
      <Sider
        width={240}
        theme="light"
        style={{ borderRight: "1px solid #f0f0f0", overflow: "auto" }}
      >
        <div style={{ padding: "10px 10px 6px" }}>
          <Input.Search
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 6 }}
            size="small"
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </Text>
        </div>

        {error && (
          <Text
            type="danger"
            style={{ padding: "0 10px", display: "block", fontSize: 12 }}
          >
            {error}
          </Text>
        )}

        {contacts.length === 0 ? (
          <Empty
            description="Ouvre un fichier .vcf"
            style={{ marginTop: 40 }}
          />
        ) : (
          <List
            dataSource={filtered}
            renderItem={(c) => (
              <List.Item
                onClick={() => handleSelectContact(c)}
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                  background: selected?.id === c.id ? "#e6f4ff" : "transparent",
                  borderLeft:
                    selected?.id === c.id
                      ? "3px solid #1677ff"
                      : "3px solid transparent",
                  borderBottom: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar
                    size={28}
                    src={c.photo || undefined}
                    icon={!c.photo && <UserOutlined />}
                    style={{
                      backgroundColor: c.photo ? "transparent" : "#1677ff",
                      flexShrink: 0,
                    }}
                    onError={() => true}
                  />
                  <Text
                    strong={selected?.id === c.id}
                    style={{ fontSize: 13, lineHeight: "1.2" }}
                  >
                    {c.fn}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </Sider>

      {/* Contenu principal */}
      <Content style={{ padding: 24, overflow: "auto", background: "#fff" }}>
        {displayedContact ? (
          <ContactDetail
            contact={displayedContact}
            onSave={handleSaveContact}
            onDirtyChange={setIsDirty}
          />
        ) : (
          <Empty
            description="Ouvre un fichier .vcf et sélectionne un contact"
            style={{ marginTop: 100 }}
          />
        )}
      </Content>

      {/* Modal confirmation abandon */}
      <Modal
        open={!!pendingAction}
        title="Modifications non sauvegardées"
        okText="Abandonner"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
        onOk={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
      >
        Voulez-vous abandonner les modifications en cours ?
      </Modal>

      <Modal
        open={aboutOpen}
        onCancel={() => setAboutOpen(false)}
        footer={
          <Button type="primary" onClick={() => setAboutOpen(false)}>
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
    </Layout>
  );
}
