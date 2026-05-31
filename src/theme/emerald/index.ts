import chroma from "chroma-js";
import { DeepPartial, Theme, extendTheme } from "@chakra-ui/react";

import { cardTheme } from "../default/components/card";
import { pallet } from "../helpers";
import { buttonTheme } from "../default/components/button";
import { drawerTheme } from "../default/components/drawer";
import { modalTheme } from "../default/components/modal";
import { menuTheme } from "../default/components/menu";

const emeraldTheme = extendTheme({
  colors: {
    gray: pallet(chroma.scale(["#a8d4b8", "#0a120e"]).colors(10)),
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
      "chakra-body-bg": { _light: "white", _dark: "#0a120e" },
      "chakra-subtle-bg": { _light: "gray.100", _dark: "#112217" },
      "chakra-subtle-text": { _light: "gray.600", _dark: "gray.400" },
      "chakra-border-color": { _light: "gray.200", _dark: "#1a3a24" },
      "glass-bg": { _light: "whiteAlpha.800", _dark: "blackAlpha.800" },
      "glass-bg-subtle": { _light: "blackAlpha.50", _dark: "whiteAlpha.50" },
      "glass-bg-hover": { _light: "blackAlpha.100", _dark: "whiteAlpha.100" },
    },
  },
} as DeepPartial<Theme>);

export default emeraldTheme;
