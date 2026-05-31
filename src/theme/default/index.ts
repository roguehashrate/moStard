import chroma from "chroma-js";
import { DeepPartial, Theme, extendTheme } from "@chakra-ui/react";

import { cardTheme } from "./components/card";
import { pallet } from "../helpers";
import { buttonTheme } from "./components/button";
import { drawerTheme } from "./components/drawer";
import { modalTheme } from "./components/modal";
import { menuTheme } from "./components/menu";

const defaultTheme = extendTheme({
  colors: {
    gray: pallet(chroma.scale(["#d8d0c8", "#0e0c0a"]).colors(10)),
  },
  components: {
    Card: cardTheme,
    Button: buttonTheme,
    Drawer: drawerTheme,
    Modal: modalTheme,
    Menu: menuTheme,
  },
  semanticTokens: {
    colors: {
      "chakra-body-text": { _light: "gray.800", _dark: "white" },
      "chakra-body-bg": { _light: "white", _dark: "#0d0b09" },
      "chakra-subtle-bg": { _light: "gray.100", _dark: "#1a1510" },
      "chakra-subtle-text": { _light: "gray.600", _dark: "gray.400" },
      "chakra-border-color": { _light: "gray.200", _dark: "#2a2015" },
      "glass-bg": { _light: "whiteAlpha.800", _dark: "rgba(21, 16, 10, 0.85)" },
      "glass-bg-subtle": { _light: "blackAlpha.50", _dark: "whiteAlpha.50" },
      "glass-bg-hover": { _light: "blackAlpha.100", _dark: "whiteAlpha.100" },
    },
  },
} as DeepPartial<Theme>);

export default defaultTheme;
