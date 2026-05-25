import { extendTheme, Theme, DeepPartial } from "@chakra-ui/react";
import chroma from "chroma-js";

import defaultTheme from "./default";
import sapphireTheme from "./sapphire";
import emeraldTheme from "./emerald";
import { drawerTheme } from "./drawer";
import { containerTheme } from "./container";

function pallet(colors: string[]) {
  return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].reduce(
    (pallet, key, i) => ({ ...pallet, [key]: colors[i] }),
    {},
  );
}

const themeConfigs: Record<string, { primary: string; theme?: object }> = {
  default: { primary: "#ff6600", theme: defaultTheme },
  sapphire: { primary: "#2b7be8", theme: sapphireTheme },
  emerald: { primary: "#24a35a", theme: emeraldTheme },
};

function getTheme(name: string) {
  return themeConfigs[name]?.theme ?? {};
}

export default function buildTheme(themeName: string) {
  const primary = themeConfigs[themeName]?.primary ?? "#ff6600";

  const theme = extendTheme(getTheme(themeName), {
    config: {
      initialColorMode: "system",
      useSystemColorMode: true,
    },
    colors: {
      primary: pallet(chroma.scale([chroma(primary).brighten(1), chroma(primary).darken(1)]).colors(10)),
    },
    components: {
      Container: containerTheme,
      Drawer: drawerTheme,
    },
    semanticTokens: {
      colors: {
        "card-hover-overlay": {
          _light: "blackAlpha.50",
          _dark: "whiteAlpha.50",
        },
      },
    },
  } as DeepPartial<Theme>);

  return theme;
}
