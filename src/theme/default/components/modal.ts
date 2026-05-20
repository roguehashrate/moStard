// https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/theme/src/components/modal.ts

import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar, defineStyle } from "@chakra-ui/styled-system";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("modal-bg");

const baseStyleDialog = defineStyle({
  [$bg.variable]: "colors.white",
  _dark: {
    [$bg.variable]: "colors.gray.800",
  },
});

const baseStyle = definePartsStyle({
  dialog: {
    ...baseStyleDialog,
    paddingTop: "var(--safe-top)",
    paddingBottom: "var(--safe-bottom)",
  },
  closeButton: {
    top: "calc(var(--chakra-space-2) + var(--safe-top))",
    right: "calc(var(--chakra-space-3) + var(--safe-right))",
  },
});

export const modalTheme = defineMultiStyleConfig({
  baseStyle,
});
