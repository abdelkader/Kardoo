import { useState } from "react";
import { Modal, Checkbox, Button } from "antd";

const ADDRESS_TYPES = [
  "Home",
  "Work",
  "Postal",
  "Parcel",
  "International",
  "Domestic",
];

export default function AddressDialog({ open, onOk, onCancel }) {
  const [selected, setSelected] = useState([]);
  const [preferred, setPreferred] = useState(false);

  const toggle = (type) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleOk = () => {
    if (selected.length === 0) return;
    onOk({ types: selected, preferred });
    setSelected([]);
    setPreferred(false);
  };

  return (
    <Modal
      title="Type d'adresse"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Annuler
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk}>
          OK
        </Button>,
      ]}
      width={320}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          margin: "16px 0",
        }}
      >
        {ADDRESS_TYPES.map((type) => (
          <Checkbox
            key={type}
            checked={selected.includes(type)}
            onChange={() => toggle(type)}
          >
            {type}
          </Checkbox>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <Checkbox
          checked={preferred}
          onChange={(e) => setPreferred(e.target.checked)}
        >
          Preferred
        </Checkbox>
      </div>
    </Modal>
  );
}
