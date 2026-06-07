import { cardAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

const baseStyle = definePartsStyle({
  container: {
    borderRadius: 0,
    borderWidth: 0,
    bg: "transparent",
  },
});

export const cardTheme = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    variant: "unstyled",
  },
});
