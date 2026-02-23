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
} from "antd";
import { UserOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { OpenVCardFile, SaveVCardFile } from "../wailsjs/go/main/App";
import { splitAndParse, generateAllVCards } from "./utils/vcard";
import ContactDetail from "./components/ContactDetail";
import "antd/dist/reset.css";

const { Sider, Content } = Layout;
const { Text } = Typography;

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [displayedContact, setDisplayedContact] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState("");

  const handleSelectContact = (c) => {
    if (isDirty) {
      Modal.confirm({
        title: "Modifications non sauvegardées",
        content: "Voulez-vous abandonner les modifications en cours ?",
        okText: "Abandonner",
        cancelText: "Annuler",
        okButtonProps: { danger: true },
        onOk: () => {
          setIsDirty(false);
          setSelected(c);
          setDisplayedContact(c);
        },
      });
    } else {
      setSelected(c);
      setDisplayedContact(c);
    }
  };

  const handleOpen = async () => {
    setError("");
    try {
      const result = await OpenVCardFile();
      if (!result) return;
      setCurrentFilePath(result.path);
      const parsed = splitAndParse(result.content);
      setContacts(parsed);
      setSelected(parsed[0] || null);
      setDisplayedContact(parsed[0] || null);
    } catch (e) {
      setError("Erreur : " + e.message);
      console.error(e);
    }
  };

  const handleSaveContact = async (updated) => {
    const newContacts = contacts.map((c) =>
      c.id === updated.id ? updated : c,
    );
    setContacts(newContacts);
    setSelected(updated);
    setDisplayedContact(updated);

    // Sauvegarder sur disque
    try {
      const content = generateAllVCards(newContacts);
      await SaveVCardFile(currentFilePath, content);
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      setError("Erreur de sauvegarde : " + e.message);
    }
  };

  const filtered = contacts.filter((c) =>
    c.fn.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        width={260}
        theme="light"
        style={{ borderRight: "1px solid #f0f0f0", overflow: "auto" }}
      >
        <div style={{ padding: 12 }}>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleOpen}
            block
            type="primary"
            style={{ marginBottom: 10 }}
          >
            Ouvrir .vcf
          </Button>
          <Input.Search
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 6 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </Text>
        </div>

        {error && (
          <Text type="danger" style={{ padding: "0 12px", display: "block" }}>
            {error}
          </Text>
        )}

        {contacts.length === 0 ? (
          <Empty description="Aucun contact" style={{ marginTop: 40 }} />
        ) : (
          <List
            dataSource={filtered}
            renderItem={(c) => (
              <List.Item
                onClick={() => handleSelectContact(c)}
                style={{
                  padding: "6px 12px",
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
                  <div style={{ textAlign: "left", overflow: "hidden" }}>
                    <Text
                      strong={selected?.id === c.id}
                      style={{ fontSize: 13, lineHeight: "1.2" }}
                    >
                      {c.fn}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Sider>

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
    </Layout>
  );
}
