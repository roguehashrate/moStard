import { defineStyle, defineStyleConfig } from "@chakra-ui/styled-system";
import { mode } from "@chakra-ui/theme-tools";

const variantGhost = defineStyle({
  _hover: {
    bg: "blackAlpha.50",
    _dark: { bg: "whiteAlpha.50" },
  },
  _active: {
    bg: "blackAlpha.100",
    _dark: { bg: "whiteAlpha.100" },
  },
});

export const buttonTheme = defineStyleConfig({
  baseStyle: {
    borderRadius: "xl",
    fontWeight: "normal",
  },
  variants: {
    ghost: variantGhost,
  },
});
