import { useState, useEffect } from "react";
import { Modal, Empty } from "antd";
import { generateAllVCards } from "./utils/vcard";
import { LoadConfig, SaveVCardFile } from "../wailsjs/go/main/App";
import { OnFileDrop } from "../wailsjs/runtime/runtime";
import { useContacts } from "./hooks/useContacts";
import IconBar from "./components/IconBar";
import ContactTree from "./components/ContactTree";
import ContactDetail from "./components/ContactDetail";
import GroupDetail from "./components/GroupDetail";
import AboutDialog from "./components/AboutDialog";
import SettingsDialog from "./components/SettingsDialog";
import QrCodeDialog from "./components/QrCodeDialog";
import ExportDialog from "./components/ExportDialog";
import TitleBar from "./components/TitleBar";
import ImportDialog from "./components/ImportDialog";
import MediaDialog from "./components/MediaDialog";
import "antd/dist/reset.css";
import { useTranslation } from "react-i18next";

export default function App() {
  const [search, setSearch] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [appConfig, setAppConfig] = useState({
    backupOnSave: false,
    backupDir: "",
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [exportContacts, setExportContacts] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
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
    deleteContacts,
    importContacts,
    openFileFromPath,
  } = useContacts(appConfig);

  useEffect(() => {
    LoadConfig()
      .then((cfg) => {
        setAppConfig(cfg);
        if (cfg.language) i18n.changeLanguage(cfg.language);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    OnFileDrop((x, y, paths) => {
      const vcfFiles = paths.filter((f) => f.toLowerCase().endsWith(".vcf"));
      if (vcfFiles.length === 0) return;
      withDirtyCheck(() => openFileFromPath(vcfFiles[0]));
    }, false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        // Sauvegarder — on émet un événement custom que ContactDetail écoutera
        window.dispatchEvent(new CustomEvent("kardoo:save"));
      }
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        withDirtyCheck(openFile);
      }
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleNewContact();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, displayedContact]);

  const withDirtyCheck = (action) => {
    if (isDirty) setPendingAction(() => action);
    else action();
  };

  const handleExport = () => {
    const toExport =
      checkedIds.length > 0
        ? contacts.filter((c) => checkedIds.includes(c.id))
        : contacts.filter((c) => c.kind !== "group");
    setExportContacts(toExport);
    setExportOpen(true);
  };

  const handleDeleteContacts = (ids, onSuccess) => {
    Modal.confirm({
      title:
        ids.length === 1
          ? "Supprimer ce contact ?"
          : `Supprimer ${ids.length} contacts ?`,
      content:
        ids.length === 1
          ? "Cette action est irréversible."
          : `Vous allez supprimer ${ids.length} contacts. Cette action est irréversible.`,
      okText: "Supprimer",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteContacts(ids);
        onSuccess?.();
        setIsDirty(false);
      },
    });
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TitleBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <IconBar
          onOpen={() => withDirtyCheck(openFile)}
          onSettings={() => setSettingsOpen(true)}
          onAbout={() => setAboutOpen(true)}
          onNewContact={handleNewContact}
          onQrCode={() => setQrOpen(true)}
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
          onMedia={() => setMediaOpen(true)}
        />
        <div
          style={{
            width: 240,
            borderRight: "1px solid #f0f0f0",
            overflow: "auto",
            background: "#fff",
          }}
        >
          <ContactTree
            contacts={contacts}
            selected={selected}
            search={search}
            onSearch={setSearch}
            onSelect={(c) => withDirtyCheck(() => selectContact(c))}
            onDelete={handleDeleteContacts}
            checkedIds={checkedIds}
            onCheckedChange={setCheckedIds}
            error={error}
          />
        </div>
        <div
          style={{ flex: 1, padding: 24, overflow: "auto", background: "#fff" }}
        >
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
                onExport={handleExport}
                exportLabel={
                  checkedIds.length > 0
                    ? t("export.export_selected", { count: checkedIds.length })
                    : t("export.export_all", {
                        count: contacts.filter((c) => c.kind !== "group")
                          .length,
                      })
                }
              />
            )
          ) : (
            <Empty
              description={t("app.no_contact_selected")}
              style={{ marginTop: 100 }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
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
      <QrCodeDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        contact={displayedContact}
      />
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        contacts={exportContacts}
      />
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={importContacts}
      />
      <MediaDialog
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        contacts={contacts}
        onSave={saveContact}
      />
    </div>
  );
}
