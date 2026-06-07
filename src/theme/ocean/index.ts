import chroma from "chroma-js";
import { DeepPartial, Theme, extendTheme } from "@chakra-ui/react";

import { cardTheme } from "../default/components/card";
import { pallet } from "../helpers";
import { buttonTheme } from "../default/components/button";
import { drawerTheme } from "../default/components/drawer";
import { modalTheme } from "../default/components/modal";
import { menuTheme } from "../default/components/menu";

const oceanTheme = extendTheme({
  colors: {
    gray: pallet(chroma.scale(["#a8d0d0", "#0a1414"]).colors(10)),
    primary: pallet(chroma.scale(["#80cbc4", "#00695c"]).colors(10)),
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
      "chakra-body-text": { _light: "gray.800", _dark: "#E0E0E0" },
      "chakra-body-bg": { _light: "#ECECEC", _dark: "#0A0A0B" },
      "chakra-subtle-bg": { _light: "#F5F5F5", _dark: "#1C1C1E" },
      "chakra-subtle-text": { _light: "gray.500", _dark: "#9998A0" },
      "chakra-border-color": { _light: "#CCCCCC", _dark: "#38383A" },
      "glass-bg": { _light: "#ECECEC", _dark: "#0A0A0B" },
      "glass-bg-subtle": { _light: "blackAlpha.50", _dark: "whiteAlpha.50" },
      "glass-bg-hover": { _light: "blackAlpha.50", _dark: "whiteAlpha.50" },
    },
  },
} as DeepPartial<Theme>);

export default oceanTheme;
