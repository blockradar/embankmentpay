import { useEffect, useState } from "react";
import QRCode from "qrcode";
import styles from "./QrCode.module.css";

/**
 * Renders a real, scannable QR code for the given value (a deposit address,
 * typically) — themed to match the app (cream modules, transparent
 * background) rather than a library-default black-on-white box.
 */
export function QrCode({ value, size = 120 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      margin: 1,
      color: { dark: "#f4efe6", light: "#00000000" },
    })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!svg) {
    return (
      <div className={styles.wrap} style={{ width: size, height: size }}>
        <span className={styles.fallback}>QR</span>
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      style={{ width: size, height: size }}
      // eslint-disable-next-line react/no-danger -- QRCode.toString output is
      // locally generated markup, not user/network-supplied HTML.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
