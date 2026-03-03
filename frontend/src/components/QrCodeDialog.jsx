import { useState, useEffect, useRef } from "react";
import { Modal, Button, Switch, Typography, Alert } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import QRCode from "qrcode";
import { generateVCard } from "../utils/vcard";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default function QrCodeDialog({ open, onClose, contact }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [withPhoto, setWithPhoto] = useState(false);
  const [dataSize, setDataSize] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !contact) return;
    setError("");
    generateQr();
  }, [open, contact, withPhoto]);

  const generateQr = async () => {
    setError("");
    try {
      const stripped = withPhoto
        ? contact
        : { ...contact, photo: null, logo: null, sound: null };
      const vcfText = generateVCard(stripped);
      setDataSize(vcfText.length);

      // Attendre que le canvas soit dans le DOM
      setTimeout(async () => {
        if (!canvasRef.current) return;
        try {
          await QRCode.toCanvas(canvasRef.current, vcfText, {
            width: 280,
            margin: 2,
            errorCorrectionLevel: vcfText.length > 2000 ? "L" : "M",
            color: { dark: "#000000", light: "#ffffff" },
          });
        } catch (e) {
          setError(
            t("qrcode.too_large_data"),
          );
        }
      }, 50);
    } catch (e) {
      setError(
        t("qrcode.too_large_data"),
      );
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${contact?.fn || "contact"}_qrcode.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const sizeColor =
    dataSize > 2500 ? "danger" : dataSize > 1500 ? "warning" : "success";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`QR Code — ${contact?.fn || ""}`}
      width={360}
      centered
      footer={[
        <Button key="close" onClick={onClose}>
          {t("qrcode.close")}
        </Button>,
        <Button
          key="dl"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        >
          {t("qrcode.download_png")}
        </Button>,
      ]}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Toggle photo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-start",
          }}
        >
          <Switch size="small" checked={withPhoto} onChange={setWithPhoto} />
          <Text style={{ fontSize: 12 }}>{t("qrcode.photo")}</Text>
          {withPhoto && (
            <Text type="warning" style={{ fontSize: 11 }}>
              {t("qrcode.limit_warning")}
            </Text>
          )}
        </div>

        {/* Taille des données */}
        <div style={{ alignSelf: "stretch" }}>
          <Text type={sizeColor} style={{ fontSize: 11 }}>
            {t("qrcode.char_count", { count: dataSize })}
            {" — "}
            {dataSize > 2500
              ? t("qrcode.too_bulky")
              : dataSize > 1500
                ? t("qrcode.approx_limit")
                : "OK"}
          </Text>
        </div>

        {/* QR Code */}
        {error && (
          <Alert type="error" message={error} style={{ width: "100%" }} />
        )}
        <canvas
          ref={canvasRef}
          style={{
            borderRadius: 8,
            border: "1px solid #eee",
            display: error ? "none" : "block", // ← toujours dans le DOM
          }}
        />

        <Text type="secondary" style={{ fontSize: 11, textAlign: "center" }}>
          {t("qrcode.scan_qr")}
        </Text>
      </div>
    </Modal>
  );
}
