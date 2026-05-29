import { defineStyle, defineStyleConfig } from "@chakra-ui/styled-system";
import { mode } from "@chakra-ui/theme-tools";

const variantLink = defineStyle((props) => {
  const { colorScheme: c } = props;
  return {
    color: c === "gray" ? "colors.chakra-body-text" : mode(`${c}.500`, `${c}.200`)(props),
    _hover: {
      textDecoration: "none",
      opacity: 0.8,
    },
  };
});

const variantSolid = defineStyle((props) => {
  const { colorScheme: c } = props;

  if (c === "gray") {
    const bg = mode(`gray.50`, `whiteAlpha.200`)(props);
    return {
      bg,
      _hover: {
        bg: mode(`gray.100`, `whiteAlpha.300`)(props),
        _disabled: { bg },
      },
      _active: { bg: mode(`gray.200`, `whiteAlpha.400`)(props) },
    };
  }

  if (c === "primary") {
    return {
      bg: mode("primary.500", "primary.600")(props),
      color: "white",
      _hover: {
        bg: mode("primary.600", "primary.500")(props),
      },
      _active: {
        bg: mode("primary.700", "primary.400")(props),
      },
    };
  }

  return {};
});

const variantGhost = defineStyle({
  borderRadius: "full",
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
    borderRadius: "full",
    fontWeight: "medium",
  },
  variants: {
    link: variantLink,
    solid: variantSolid,
    ghost: variantGhost,
  },
});
