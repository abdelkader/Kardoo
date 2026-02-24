import { useState, useEffect } from "react";
import { Layout, Modal, Empty } from "antd";
import { generateAllVCards, createEmptyContact } from "./utils/vcard";
import {
  LoadConfig,
  SetWindowPosition,
  SaveVCardFile,
} from "../wailsjs/go/main/App";
import { useContacts } from "./hooks/useContacts";
import IconBar from "./components/IconBar";
import ContactTree from "./components/ContactTree";
import ContactDetail from "./components/ContactDetail";
import GroupDetail from "./components/GroupDetail";
import AboutDialog from "./components/AboutDialog";
import SettingsDialog from "./components/SettingsDialog";
import "antd/dist/reset.css";
import { useTranslation } from "react-i18next";

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
  const { i18n, t } = useTranslation();
  const {
    contacts,
    selected,
    displayedContact,
    currentFilePath,
    error,
    openFile,
    saveContact,
    selectContact,
    newContact,
  } = useContacts(appConfig);

  useEffect(() => {
    LoadConfig()
      .then((cfg) => {
        setAppConfig(cfg);
        if (cfg.language) i18n.changeLanguage(cfg.language);
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

  const handleNewContact = () =>
    withDirtyCheck(async () => {
      const result = await newContact(contacts, currentFilePath);
      if (result) {
        // Sauvegarde immédiate du fichier avec le nouveau contact vide
        try {
          await SaveVCardFile(
            result.path,
            generateAllVCards(result.contacts),
            appConfig.backupOnSave,
            appConfig.backupDir,
          );
        } catch (e) {
          console.error("Erreur création fichier:", e);
        }
      }
    });

  const filtered = contacts.filter((c) =>
    c.fn.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout style={{ height: "100vh" }}>
      <IconBar
        onOpen={() => withDirtyCheck(openFile)}
        onSettings={() => setSettingsOpen(true)}
        onAbout={() => setAboutOpen(true)}
        onNewContact={handleNewContact} // ← ajoute cette ligne
      />

      <Sider
        width={240}
        theme="light"
        style={{ borderRight: "1px solid #f0f0f0", overflow: "auto" }}
      >
        <ContactTree
          contacts={contacts}
          selected={selected}
          search={search}
          onSearch={setSearch}
          onSelect={(c) => withDirtyCheck(() => selectContact(c))}
          error={error}
        />
      </Sider>

      <Content style={{ padding: 24, overflow: "auto", background: "#fff" }}>
        {displayedContact ? (
          displayedContact.kind === "group" ? (
            <GroupDetail
              group={displayedContact}
              allContacts={contacts}
              onSave={saveContact}
              onDirtyChange={setIsDirty}
            />
          ) : (
            <ContactDetail
              contact={displayedContact}
              onSave={saveContact}
              onDirtyChange={setIsDirty}
            />
          )
        ) : (
          <Empty
            description={t("app.no_contact_selected")}
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
        {t("dirty.content")}
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
