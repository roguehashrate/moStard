import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar, defineStyle } from "@chakra-ui/styled-system";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("modal-bg");

const baseStyleDialog = defineStyle({
  [$bg.variable]: "colors.white",
  borderRadius: "3xl",
  _dark: {
    [$bg.variable]: "colors.gray.800",
  },
});

const baseStyleOverlay = defineStyle({
  bg: "blackAlpha.700",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
});

const baseStyle = definePartsStyle({
  overlay: baseStyleOverlay,
  dialog: {
    ...baseStyleDialog,
    paddingTop: "var(--safe-top)",
    paddingBottom: "var(--safe-bottom)",
    boxShadow: "dark-lg",
  },
  closeButton: {
    top: "calc(var(--chakra-space-2) + var(--safe-top))",
    right: "calc(var(--chakra-space-3) + var(--safe-right))",
    borderRadius: "full",
    bg: "blackAlpha.100",
    _dark: { bg: "whiteAlpha.100" },
    _hover: {
      bg: "blackAlpha.200",
      _dark: { bg: "whiteAlpha.200" },
    },
  },
});

export const modalTheme = defineMultiStyleConfig({
  baseStyle,
});
