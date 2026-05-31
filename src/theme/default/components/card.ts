import { cardAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar } from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("card-bg");

const baseStyle = definePartsStyle({
  container: {
    borderRadius: "2xl",
    borderWidth: 0,
  },
});

const variantElevated = definePartsStyle({
  container: {
    boxShadow: "lg",
    _dark: {
      [$bg.variable]: "colors.chakra-subtle-bg",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    },
  },
});

const variantFilled = definePartsStyle({
  container: {
    [$bg.variable]: "colors.chakra-subtle-bg",
  },
});

const variantOutline = definePartsStyle({
  container: {
    borderWidth: "1px",
    borderColor: "chakra-border-color",
    bg: "glass-bg",
  },
});

export const cardTheme = defineMultiStyleConfig({
  baseStyle,
  variants: {
    elevated: variantElevated,
    filled: variantFilled,
    outline: variantOutline,
  },
  defaultProps: {
    variant: "outline",
  },
});
