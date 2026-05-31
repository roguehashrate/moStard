import { Box } from "@chakra-ui/react";

export const ARC_OVERHANG_PX = 20;
export const ARC_UP_OVERHANG_PX = 28;

const ARC_DOWN_PATH = "M0,0 L100,0 L100,44 Q50,64 0,44 Z";
const ARC_UP_PATH = "M0,30 Q50,0 100,30 L100,64 L0,64 Z";
const RECT_PATH = "M0,0 L100,0 L100,64 L0,64 Z";

interface ArcBackgroundProps {
  variant: "down" | "up" | "rect";
}

export function ArcBackground({ variant }: ArcBackgroundProps) {
  const path = variant === "down" ? ARC_DOWN_PATH : variant === "up" ? ARC_UP_PATH : RECT_PATH;
  const hasArc = variant !== "rect";
  const overhang = variant === "up" ? ARC_UP_OVERHANG_PX : ARC_OVERHANG_PX;

  return (
    <Box
      position="absolute"
      {...(variant === "up" ? { bottom: 0, left: 0, right: 0 } : { inset: 0 })}
      w="full"
      pointerEvents="none"
      overflow="hidden"
      sx={{
        "& svg": {
          display: "block",
          width: "100%",
          height: hasArc ? `calc(100% + ${overhang}px)` : "100%",
        },
      }}
    >
      <svg
        viewBox="0 0 100 64"
        preserveAspectRatio="none"
        style={
          variant === "up"
            ? { position: "absolute", bottom: 0, left: 0, right: 0 }
            : { position: "absolute", inset: 0 }
        }
      >
        <path d={path} fill="var(--chakra-colors-chakra-body-bg)" fillOpacity="0.85" />
        {variant === "down" && (
          <path
            d="M0,44 Q50,64 100,44"
            fill="none"
            stroke="var(--chakra-colors-chakra-border-color)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {variant === "up" && (
          <path
            d="M0,30 Q50,0 100,30"
            fill="none"
            stroke="var(--chakra-colors-chakra-border-color)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </Box>
  );
}
