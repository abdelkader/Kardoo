import { useState } from "react";
import {
  splitAndParse,
  generateAllVCards,
  createEmptyContact,
} from "../utils/vcard";
import {
  OpenVCardFile,
  SaveVCardFile,
  NewVCardFile,
} from "../../wailsjs/go/main/App";

export function useContacts(appConfig) {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [displayedContact, setDisplayedContact] = useState(null);
  const [currentFilePath, setCurrentFilePath] = useState("");
  const [error, setError] = useState("");

  const openFile = async () => {
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
    }
  };

  const saveContact = async (updated) => {
    const newContacts = contacts.map((c) =>
      c.id === updated.id ? updated : c,
    );
    setContacts(newContacts);
    setSelected(updated);
    setDisplayedContact(updated);
    try {
      await SaveVCardFile(
        currentFilePath,
        generateAllVCards(newContacts),
        appConfig.backupOnSave,
        appConfig.backupDir,
      );
    } catch (e) {
      setError("Erreur de sauvegarde : " + e.message);
    }
  };

  const selectContact = (c) => {
    setSelected(c);
    setDisplayedContact(c);
  };

  const newContact = async (currentContacts, currentFilePath) => {
    const newC = createEmptyContact(Date.now());

    // Si un fichier est déjà ouvert — on ajoute simplement le contact
    if (currentFilePath) {
      const updated = [...currentContacts, newC];
      setContacts(updated);
      setSelected(newC);
      setDisplayedContact(newC);
      return { contacts: updated, path: currentFilePath };
    }

    // Sinon — on crée un nouveau fichier
    try {
      const result = await NewVCardFile();
      if (!result?.path) return null;

      const updated = [newC];
      setContacts(updated);
      setSelected(newC);
      setDisplayedContact(newC);
      setCurrentFilePath(result.path);
      return { contacts: updated, path: result.path };
    } catch (e) {
      setError("Erreur : " + e.message);
      return null;
    }
  };

  return {
    contacts,
    selected,
    displayedContact,
    currentFilePath,
    error,
    openFile,
    saveContact,
    selectContact,
    newContact,
  };
}
