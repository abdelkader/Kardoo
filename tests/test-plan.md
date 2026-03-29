# Kardoo — Test Plan

## 1. File Operations

### 1.1 Open File
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.1.1 | Open valid VCF | Click Open → select `test-valid.vcf` | Contacts loaded, TitleBar shows filename |
| 1.1.2 | Open VCF with missing BEGIN | Select `test-missing-begin.vcf` | Contact loaded or graceful error |
| 1.1.3 | Open empty VCF | Select `test-empty.vcf` | Empty list, no crash |
| 1.1.4 | Open VCF with special chars | Select `test-special-chars.vcf` | Names with accents display correctly |
| 1.1.5 | Drag & drop VCF | Drop `test-valid.vcf` on window | Contacts loaded |
| 1.1.6 | Drag & drop non-VCF | Drop a `.txt` file | Nothing happens |
| 1.1.7 | Open with unsaved changes | Edit contact → click Open | Dirty check dialog appears |

### 1.2 Save
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.2.1 | Save contact | Edit a field → click Save | Orange dot disappears, file written |
| 1.2.2 | Ctrl+S shortcut | Edit a field → press Ctrl+S | Contact saved |
| 1.2.3 | Save with backup | Enable backup in settings → save | Backup file created in backup dir |

### 1.3 New Contact
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.3.1 | New contact (file open) | Click New Contact | Empty contact added to list |
| 1.3.2 | New contact (no file) | Click New Contact | Save dialog appears first |
| 1.3.3 | Ctrl+N shortcut | Press Ctrl+N | Same as 1.3.1 / 1.3.2 |

---

## 2. Import

### 2.1 VCF Import
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.1.1 | Import single VCF | Tools → Import → select `test-valid.vcf` | Contacts merged |
| 2.1.2 | Import multi-contact VCF | Select `test-multi.vcf` | All contacts imported |
| 2.1.3 | Import VCF v3 | Select `test-v3.vcf` | Contact parsed correctly |
| 2.1.4 | Import VCF v4 | Select `test-v4.vcf` | Contact parsed correctly |

### 2.2 jCard (JSON) Import
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.2.1 | Import single jCard | Select `test-jcard-single.json` | 1 contact imported |
| 2.2.2 | Import array jCard | Select `test-jcard-array.json` | Multiple contacts imported |
| 2.2.3 | jCard with type as string | Select `test-jcard-type-string.json` | Types (work/home) correct |
| 2.2.4 | jCard with type as array | Select `test-jcard-type-array.json` | Types correct |

### 2.3 xCard (XML) Import
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.3.1 | Import xCard | Select `test-xcard.xml` | Contact imported correctly |

### 2.4 CSV Import
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.4.1 | Import Google CSV | Select `test-google.csv` | Contacts imported |
| 2.4.2 | CSV with quoted fields | Select `test-csv-quoted.csv` | Fields with commas parsed correctly |

---

## 3. Export

### 3.1 General
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.1.1 | Export with no contacts | Tools → Export (no file loaded) | Toast "No contacts loaded" |
| 3.1.2 | Export all as VCF | Tools → Export → VCF | File contains all contacts |
| 3.1.3 | Export selected as VCF | Check contacts → Export | Only checked contacts exported |
| 3.1.4 | Export as jCard | Tools → Export → JSON | Valid jCard format |
| 3.1.5 | Export as xCard | Tools → Export → XML | Valid xCard format |
| 3.1.6 | Export as CSV | Tools → Export → CSV | Valid CSV format |

### 3.2 Field Filter
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.2.1 | Export FN only | Settings → Export Fields → FN only → Export VCF | Only FN field in file |
| 3.2.2 | Export all fields (default) | Settings → Export Fields → All → Export | All fields present |
| 3.2.3 | Filter applies to JSON | FN only → Export JSON | Only FN in jCard |
| 3.2.4 | Filter applies to CSV | FN only → Export CSV | Only Name column in CSV |

---

## 4. Contact Editing

### 4.1 Fields
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.1.1 | Edit name | Change Full Name → Save | Name updated in list |
| 4.1.2 | Add phone | Click + in Phones → enter number → Save | Phone saved |
| 4.1.3 | Add email | Click + in Emails → enter email → Save | Email saved |
| 4.1.4 | Add address | Click + in Address → fill fields → Save | Address saved |
| 4.1.5 | Add photo | Click camera icon → select image | Photo displayed |
| 4.1.6 | Remove photo | Delete photo → Save | Photo removed |
| 4.1.7 | Add logo | Extra tab → click camera on logo | Logo displayed |
| 4.1.8 | Add sound | Extra tab → click + on Sound | Audio player shown |

### 4.2 Dirty State
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.2.1 | Dirty indicator | Edit any field | Orange dot in TitleBar |
| 4.2.2 | Clean after save | Save → check TitleBar | Orange dot gone |
| 4.2.3 | Switch contact dirty | Edit → click another contact | Dirty check dialog |

---

## 5. Duplicates

### 5.1 Detection
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.1.1 | No contacts loaded | Tools → Find Duplicates | Toast "No contacts loaded" |
| 5.1.2 | No duplicates | Load `test-no-duplicates.vcf` → Find Duplicates | "No duplicates detected" |
| 5.1.3 | Duplicate by name | Load `test-duplicates.vcf` → Find Duplicates | Groups shown |
| 5.1.4 | Duplicate by phone | Same → check Phone only | Phone duplicates shown |
| 5.1.5 | Duplicate by email | Same → check Email | Email duplicates shown |
| 5.1.6 | Certain confidence | Contacts with +E.164 numbers | Red "Certain" badge |
| 5.1.7 | Probable confidence | Contacts without country code | Orange "Probable" badge |

### 5.2 Actions
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.2.1 | Merge | Click Merge on group | Single contact kept, others removed |
| 5.2.2 | Merge keeps most complete | Merge contact with photo vs without | Photo preserved |
| 5.2.3 | Merge combines phones | Merge contacts with different numbers | All numbers kept |
| 5.2.4 | Delete duplicates | Click Delete duplicates | First kept, others deleted |
| 5.2.5 | Ignore | Click Ignore | Group removed from list only |
| 5.2.6 | Merge all | Click Merge All | All groups merged at once |

---

## 6. Media Manager

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.1 | Open Media Manager | Tools → Media | Dialog opens with tabs |
| 6.2 | Photos tab | Click Photos | List of contacts with photos |
| 6.3 | Download photo | Click download icon | Save dialog appears |
| 6.4 | Delete photo | Click delete → confirm | Photo removed from contact |
| 6.5 | Logos tab | Click Logos | List of contacts with logos |
| 6.6 | Audio tab | Click Audio | List of contacts with sounds |
| 6.7 | Play audio | Click play | Audio plays in browser |
| 6.8 | No media | Load contacts without media | "No media found" message |

---

## 7. Settings

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 7.1 | Change language to FR | Settings → Language → FR | UI switches to French |
| 7.2 | Change language to EN | Settings → Language → EN | UI switches to English |
| 7.3 | Enable backup | Toggle backup → set dir → save | Backup created on next save |
| 7.4 | Export field filter | Uncheck fields → save | Fields missing from export |
| 7.5 | Window position saved | Move window → close → reopen | Window at same position |

---

## 8. Keyboard Shortcuts

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 8.1 | Ctrl+S | Edit contact → Ctrl+S | Contact saved |
| 8.2 | Ctrl+O | Press Ctrl+O | Open file dialog |
| 8.3 | Ctrl+N | Press Ctrl+N | New contact created |
| 8.4 | Ctrl+O with dirty | Edit → Ctrl+O | Dirty check dialog |

---

## 9. UI / TitleBar

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 9.1 | Filename in TitleBar | Open file | `Kardoo — filename.vcf` shown |
| 9.2 | No filename | No file loaded | Only "Kardoo" shown |
| 9.3 | Dirty dot | Edit contact | Orange dot next to filename |
| 9.4 | Minimize | Click minimize button | Window minimized |
| 9.5 | Maximize | Click maximize button | Window maximized |
| 9.6 | Restore | Click maximize again | Window restored |
| 9.7 | Close | Click close button | App closes |

---

## 10. QR Code

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.1 | Generate QR | Select contact → click QR icon | QR code displayed |
| 10.2 | No contact selected | Click QR with no selection | Empty or disabled |
