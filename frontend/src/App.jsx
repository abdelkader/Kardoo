import { useState, useEffect } from "react";
import { Layout, Modal, Empty } from "antd";

import { LoadConfig, SetWindowPosition } from "../wailsjs/go/main/App";
import { useContacts } from "./hooks/useContacts";
import IconBar from "./components/IconBar";
import ContactList from "./components/ContactList";
import ContactDetail from "./components/ContactDetail";
import AboutDialog from "./components/AboutDialog";
import SettingsDialog from "./components/SettingsDialog";
import "antd/dist/reset.css";

const { Sider, Content } = Layout;

export default function App() {
  const [search, setSearch] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appConfig, setAppConfig] = useState({
    backupOnSave: false,
    backupDir: "",
  });

  const {
    contacts,
    selected,
    displayedContact,
    error,
    openFile,
    saveContact,
    selectContact,
  } = useContacts(appConfig);

  useEffect(() => {
    LoadConfig()
      .then((cfg) => {
        setAppConfig(cfg);
        if (cfg.windowWidth && cfg.windowHeight) {
          SetWindowPosition(
            cfg.windowX,
            cfg.windowY,
            cfg.windowWidth,
            cfg.windowHeight,
          );
        }
      })
      .catch(console.error);
  }, []);

  const withDirtyCheck = (action) => {
    if (isDirty) setPendingAction(() => action);
    else action();
  };

  const filtered = contacts.filter((c) =>
    c.fn.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout style={{ height: "100vh" }}>
      <IconBar
        onOpen={() => withDirtyCheck(openFile)}
        onSettings={() => setSettingsOpen(true)}
        onAbout={() => setAboutOpen(true)}
      />

      <Sider
        width={240}
        theme="light"
        style={{ borderRight: "1px solid #f0f0f0", overflow: "auto" }}
      >
        <ContactList
          contacts={contacts}
          filtered={filtered}
          selected={selected}
          search={search}
          onSearch={setSearch}
          onSelect={(c) => withDirtyCheck(() => selectContact(c))}
          error={error}
        />
      </Sider>

      <Content style={{ padding: 24, overflow: "auto", background: "#fff" }}>
        {displayedContact ? (
          <ContactDetail
            contact={displayedContact}
            onSave={saveContact}
            onDirtyChange={setIsDirty}
          />
        ) : (
          <Empty
            description="Ouvre un fichier .vcf et sélectionne un contact"
            style={{ marginTop: 100 }}
          />
        )}
      </Content>

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

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          LoadConfig().then(setAppConfig).catch(console.error);
        }}
      />
    </Layout>
  );
}
