import { useState } from "react";
import {
  Modal,
  Tabs,
  Table,
  Button,
  Avatar,
  Space,
  Typography,
  Empty,
  Popconfirm,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  PictureOutlined,
  SoundOutlined,
  TrademarkOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { SaveContactPhoto } from "../../wailsjs/go/main/App";

const { Text } = Typography;

function downloadDataUri(dataUri, filename) {
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  a.click();
}

function PhotoTab({ contacts, mediaField, onDelete }) {
  const { t } = useTranslation();

  const items = contacts
    .filter((c) => c[mediaField])
    .map((c) => ({ key: c.id, contact: c, src: c[mediaField] }));

  if (items.length === 0)
    return <Empty description={t("media.none")} style={{ marginTop: 40 }} />;

  return (
    <Table
      size="small"
      dataSource={items}
      pagination={false}
      scroll={{ y: 360 }}
      columns={[
        {
          title: t("media.preview"),
          width: 60,
          render: (_, row) => <Avatar shape="square" size={40} src={row.src} />,
        },
        {
          title: t("media.contact"),
          render: (_, row) => (
            <Text style={{ fontSize: 12 }}>{row.contact.fn}</Text>
          ),
        },
        {
          title: t("media.size"),
          width: 80,
          render: (_, row) => {
            const bytes = Math.round((row.src.length * 3) / 4 / 1024);
            return (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {bytes} KB
              </Text>
            );
          },
        },
        {
          title: "",
          width: 80,
          render: (_, row) => (
            <Space>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() =>
                  SaveContactPhoto(row.src, row.contact.fn + "_" + mediaField)
                }
              />
              <Popconfirm
                title={t("media.confirm_delete")}
                onConfirm={() => onDelete(row.contact.id, mediaField)}
                okText={t("media.delete")}
                cancelText={t("media.cancel")}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  );
}

function SoundTab({ contacts, onDelete }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(null);

  const items = contacts
    .filter((c) => c.sound?.url)
    .map((c) => ({ key: c.id, contact: c, sound: c.sound }));

  if (items.length === 0)
    return <Empty description={t("media.none")} style={{ marginTop: 40 }} />;

  const handlePlay = (id, url) => {
    if (playing) {
      playing.pause();
    }
    if (playing?.src === url) {
      setPlaying(null);
      return;
    }
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlaying(null);
    setPlaying(audio);
  };

  const handleDownload = (sound, name) => {
    const ext = "." + (sound.type || "ogg");
    downloadDataUri(sound.url, name + ext);
  };

  return (
    <Table
      size="small"
      dataSource={items}
      pagination={false}
      scroll={{ y: 360 }}
      columns={[
        {
          title: t("media.contact"),
          render: (_, row) => (
            <Text style={{ fontSize: 12 }}>{row.contact.fn}</Text>
          ),
        },
        {
          title: t("media.type"),
          width: 70,
          render: (_, row) => (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {row.sound.type?.toUpperCase() || "OGG"}
            </Text>
          ),
        },
        {
          title: t("media.size"),
          width: 80,
          render: (_, row) => {
            const bytes = Math.round((row.sound.url.length * 3) / 4 / 1024);
            return (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {bytes} KB
              </Text>
            );
          },
        },
        {
          title: "",
          width: 110,
          render: (_, row) => (
            <Space>
              <Button
                size="small"
                icon={<SoundOutlined />}
                type={playing?.src === row.sound.url ? "primary" : "default"}
                onClick={() => handlePlay(row.contact.id, row.sound.url)}
              />
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(row.sound, row.contact.fn)}
              />
              <Popconfirm
                title={t("media.confirm_delete")}
                onConfirm={() => onDelete(row.contact.id, "sound")}
                okText={t("media.delete")}
                cancelText={t("media.cancel")}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  );
}

export default function MediaDialog({ open, onClose, contacts, onSave }) {
  const { t } = useTranslation();

  const handleDelete = (contactId, field) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    let updated;
    if (field === "sound") {
      updated = { ...contact, sound: null };
    } else {
      updated = { ...contact, [field]: null };
    }
    onSave(updated);
  };

  const photoCount = contacts.filter((c) => c.photo).length;
  const logoCount = contacts.filter((c) => c.logo).length;
  const soundCount = contacts.filter((c) => c.sound?.url).length;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t("media.close")}
        </Button>,
      ]}
      title={t("media.title")}
      width={600}
      centered
    >
      <Tabs
        items={[
          {
            key: "photo",
            label: (
              <span>
                <PictureOutlined /> {t("media.photos")}
                {photoCount > 0 && (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, marginLeft: 4 }}
                  >
                    ({photoCount})
                  </Text>
                )}
              </span>
            ),
            children: (
              <PhotoTab
                contacts={contacts}
                mediaField="photo"
                onDelete={handleDelete}
              />
            ),
          },
          {
            key: "logo",
            label: (
              <span>
                <TrademarkOutlined /> {t("media.logos")}
                {logoCount > 0 && (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, marginLeft: 4 }}
                  >
                    ({logoCount})
                  </Text>
                )}
              </span>
            ),
            children: (
              <PhotoTab
                contacts={contacts}
                mediaField="logo"
                onDelete={handleDelete}
              />
            ),
          },
          {
            key: "sound",
            label: (
              <span>
                <SoundOutlined /> {t("media.sounds")}
                {soundCount > 0 && (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, marginLeft: 4 }}
                  >
                    ({soundCount})
                  </Text>
                )}
              </span>
            ),
            children: <SoundTab contacts={contacts} onDelete={handleDelete} />,
          },
        ]}
      />
    </Modal>
  );
}
