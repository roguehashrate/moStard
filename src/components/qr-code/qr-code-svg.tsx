import { drawSvgPath } from "../../helpers/qrcode";
import { Ecc, QrCode } from "../../lib/qrcodegen";
import { Box, type BoxProps, Text } from "@chakra-ui/react";
import { getPaytoLogoUrl } from "../../helpers/payto-logos";
import { useMemo } from "react";

export default function QrCodeSvg({
  content,
  lightColor = "white",
  darkColor = "black",
  border = 2,
  xmrIcon = false,
  coinIcon,
  ...props
}: Omit<BoxProps, "children" | "border" | "content"> & {
  content: string;
  lightColor?: string;
  darkColor?: string;
  border?: number;
  xmrIcon?: boolean;
  coinIcon?: string;
}) {
  const qrCode = useMemo(() => {
    try {
      return QrCode.encodeText(content, Ecc.LOW);
    } catch {
      return null;
    }
  }, [content]);

  if (!qrCode) {
    return (
      <Box {...props} p="4" textAlign="center">
        <Text color="red.500">Failed to generate QR code</Text>
      </Box>
    );
  }

  const qrCodeSize = qrCode.size + border * 2;

  const imageSize = qrCodeSize * 0.2;
  const imageX = (qrCodeSize - imageSize) / 2;
  const imageY = (qrCodeSize - imageSize) / 2;

  const logoUrl = coinIcon ? getPaytoLogoUrl(coinIcon) : xmrIcon ? getPaytoLogoUrl("monero") : null;

  return (
    <Box
      as="svg"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox={`0 0 ${qrCodeSize} ${qrCodeSize}`}
      stroke="none"
      htmlWidth="100%"
      htmlHeight="100%"
      {...props}
      width="full"
    >
      <title id="qr-code-title">qr</title>
      <defs>
        <linearGradient id="orangeToBlackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#FF6600", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#000000", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill={lightColor} />
      <path d={drawSvgPath(qrCode, border)} fill="url(#orangeToBlackGradient)" />
      {logoUrl && (
        <image
          href={logoUrl}
          x={imageX}
          y={imageY}
          width={imageSize}
          height={imageSize}
        />
      )}
    </Box>
  );
}
